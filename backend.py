from flask import Flask, request, jsonify, session
from flask_cors import CORS
import whisper
import os
import json
import requests  # For calling the AI21 Jurassic-2 API (now using boto3 for Bedrock)
import secrets
from os.path import join
import boto3  # For AWS SES and Bedrock API

app = Flask(__name__)
CORS(app)
secret_key = secrets.token_hex(16)  # For session management (short-term memory)
app.secret_key = secret_key

# Initialize the Whisper model
model = whisper.load_model("base")

# Initialize AWS SES for sending emails
ses = boto3.client('ses', region_name='us-east-1')  # Change region if needed

# Initialize AWS Bedrock Client (for Jurassic-2 model)
bedrock_client = boto3.client('bedrock', region_name='us-east-1')  # Ensure Bedrock is available in this region

# Initialize F1 Visa interview questions
questions = [
    "Why do you want to study in the United States?",
    "What made you choose this specific university?",
    "How do you plan to fund your education?",
    "What are your plans after completing your degree?",
    "Do you have any family in the U.S.?",
    # Add more visa-specific questions as needed
]

# Start the interview - Jurassic greets the user
@app.route('/api/start-interview', methods=['POST'])
def start_interview():
    session['user_name'] = request.json.get('name')
    session['current_question_index'] = 0
    session['transcript'] = []
    
    # Greet the user
    greeting = call_jurassic_ai(f"Say hello to {session['user_name']} and introduce the interview. This interview is for F1 visa preparation.")
    
    return jsonify({"greeting": greeting})

# Ask the next question and process the response
@app.route('/api/next-question', methods=['POST'])
def next_question():
    current_index = session.get('current_question_index', 0)

    if current_index >= len(questions):
        return jsonify({"message": "Interview complete!"})

    # Get the current question
    question = questions[current_index]
    session['current_question'] = question

    # Captions for the question (Text of the question is used as the caption)
    caption = question

    return jsonify({"question": question, "caption": caption})

# Process the voice response and return feedback
@app.route('/api/process-voice-response', methods=['POST'])
def process_voice_response():
    # Get the audio file from the request
    audio_file = request.files['file']
    
    # Save the file temporarily
    file_path = join("temp", audio_file.filename)
    audio_file.save(file_path)
    
    # Transcribe the audio using Whisper (handles multilingual input)
    result = model.transcribe(file_path)
    transcribed_text = result['text']
    
    # Clean up the temp file
    os.remove(file_path)
    
    # Store the response and current question in the session transcript
    current_question = session.get('current_question', 'Unknown')
    transcript_entry = {"question": current_question, "response": transcribed_text}
    transcript = session.get('transcript', [])
    transcript.append(transcript_entry)
    session['transcript'] = transcript

    # Provide feedback from Jurassic-2 (e.g., "Nice answer!")
    feedback = call_jurassic_ai(f"Give brief positive feedback to the following answer from a student applying for an F1 visa who is not a native English speaker: {transcribed_text}")

    # Move to the next question
    session['current_question_index'] += 1
    
    return jsonify({'transcription': transcribed_text, 'feedback': feedback})

# Finalize the interview, generate the full transcript, and return the analysis (no email yet)
@app.route('/api/finalize-interview', methods=['POST'])
def finalize_interview():
    user_name = session.get('user_name')

    if not user_name:
        return jsonify({"error": "No user found in session"}), 400

    # Generate the full transcript from the session
    transcript = session.get('transcript', [])
    full_transcript = generate_full_transcript(transcript)

    # Send the full transcript to Jurassic-2 for analysis via Bedrock
    analysis = call_jurassic_ai(f"Analyze the following F1 visa interview transcript and provide detailed feedback for the student: {full_transcript}")
    
    # Return transcript and analysis to the frontend to be displayed
    return jsonify({
        "transcript": full_transcript,
        "analysis": analysis,
        "message": "Interview completed. Here is the analysis."
    })

# Send the transcript and feedback via email when requested by the user
@app.route('/api/send-email', methods=['POST'])
def send_email_request():
    data = request.json
    user_name = session.get('user_name')

    if not user_name:
        return jsonify({"error": "No user found in session"}), 400

    # Get the transcript and analysis from the frontend (passed in the request body)
    full_transcript = data.get('transcript', '')
    analysis = data.get('analysis', '')

    # Send the full transcript and analysis via email
    email_sent = send_email(user_name, full_transcript, analysis)
    
    if email_sent:
        return jsonify({"message": "Transcript and feedback sent via email successfully!"})
    else:
        return jsonify({"error": "Failed to send email"}), 500

# Helper function to generate a readable transcript
def generate_full_transcript(transcript):
    full_transcript = ""
    for idx, entry in enumerate(transcript):
        full_transcript += f"Question {idx+1}: {entry['question']}\n"
        full_transcript += f"Answer: {entry['response']}\n\n"
    return full_transcript

# Function to call Jurassic-2 AI (via AWS Bedrock)
def call_jurassic_ai(prompt):
    # Prepare the request body
    body = {
        "prompt": prompt,
        "maxTokens": 400,
        "temperature": 0.9,
        "topP": 0.9,
        "stopSequences": [],
        "countPenalty": {"scale": 0},
        "presencePenalty": {"scale": 0},
        "frequencyPenalty": {"scale": 0}
    }

    # Call the Jurassic-2 model through Bedrock
    response = bedrock_client.invoke_model(
        modelId='ai21.j2-ultra-v1',  # Jurassic-2 model ID on Bedrock
        contentType='application/json',
        accept='application/json',
        body=json.dumps(body)
    )

    # Read and decode the response
    result = response['body'].read().decode('utf-8')
    return result

# Function to send the transcript and feedback via AWS SES
def send_email(user_name, full_transcript, analysis):
    try:
        # Replace with actual user email or gather via frontend
        user_email = f"{user_name}@example.com"
        
        response = ses.send_email(
            Source='your-email@example.com',
            Destination={'ToAddresses': [user_email]},
            Message={
                'Subject': {
                    'Data': 'Your F1 Visa Interview Transcript and AI Feedback',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': f"Hello {user_name},\n\nHere is your interview transcript:\n\n{full_transcript}\n\nFeedback:\n{analysis}",
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

if __name__ == '__main__':
    # Ensure temp and responses directories exist
    os.makedirs('temp', exist_ok=True)
    os.makedirs('responses', exist_ok=True)

    app.run(debug=True)
