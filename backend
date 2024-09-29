from flask import Flask, request, jsonify, session
from flask_cors import CORS
import whisper
import os

app = Flask(__name__)
CORS(app)
secret_key = secrets.token_hex(16) # for session management (short-term memory)


# Initialize the Whisper model
model = whisper.load_model("base")



@app.route('/api/submit-name', methods=['POST'])
def submit_name():
    data = request.json
    user_name = data.get('name')
    
    session['user_name'] = user_name

# Endpoint to process voice input
@app.route('/api/process-voice-response', methods=['POST'])
def process_voice_response():
    # Get the audio file from the AI
    audio_file = request.files['file']
    
    # Save the file temporarily
    file_path = join("temp", audio_file.filename)
    audio_file.save(file_path)
    
    # Use Whisper to transcribe the audio
    result = model.transcribe(file_path)
    transcribed_text = result['text']
    
    # Store the response in session or a file
    store_response(transcribed_text)
    
    # Optionally, send the transcription to AI for further processing
    ai_response = call_ai(transcribed_text)

    # Clean up temporary file
    os.remove(file_path)
    
    return jsonify({'transcription': transcribed_text, 'ai_response': ai_response})

def store_response(transcription):
    # Open or create a JSON file to store responses
    user_responses_file = os.path.join("responses", f"{session['user_name']}_responses.json")

    # Check if file exists
    if not os.path.exists(user_responses_file):
        responses = []
    else:
        with open(user_responses_file, 'r') as file:
            responses = json.load(file)

    # Append the new transcription to the list
    responses.append({'question': session.get('current_question', 'Unknown'), 'response': transcription})

    # Write back the updated responses
    with open(user_responses_file, 'w') as file:
        json.dump(responses, file, indent=4)
