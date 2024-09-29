import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';  // Import useNavigate

function InterviewPage() {
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState('');
  const location = useLocation();  // Access the name passed from NameInputPage
  const navigate = useNavigate();  // Initialize navigate for redirection

  const handleSubmitResponse = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: userResponse,
          name: location.state.name  // Pass the name and response to the backend
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await response.json();  // Parse JSON response
      setFeedback(data.feedback);  // Set feedback received from the backend

      // Navigate to the email input page with the feedback or score
      navigate('/email-input', { state: { score: data.score } });  // Pass score if you have it
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <h2>Welcome, {location.state.name}. Let's start your interview!</h2>

      <textarea 
        value={userResponse}
        onChange={(e) => setUserResponse(e.target.value)}
        placeholder="Type your response here"
      />
      <button onClick={handleSubmitResponse}>Submit Response</button>

      {feedback && <p>Feedback: {feedback}</p>}
    </div>
  );
}

export default InterviewPage;
