import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function InterviewPage() {
  const location = useLocation();
  const interviewerCanvasRef = useRef(null);
  const intervieweeCanvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [animationId, setAnimationId] = useState(null); 
  const [stream, setStream] = useState(null);
  const [showRecordingText, setShowRecordingText] = useState(false);

  // Load and play interviewer's pre-recorded audio and show waveform
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const loadInterviewerAudio = async () => {
      try {
        const response = await fetch('/assets/demo.wav'); // Ensure the correct file path
        if (!response.ok) {
          throw new Error('Failed to fetch audio file');
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyser.connect(audioContext.destination);
        source.start(); 

        const canvas = interviewerCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        const drawWaveform = () => {
          analyser.getByteTimeDomainData(dataArray);

          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = '#4A90E2';

          canvasCtx.beginPath();
          const sliceWidth = (canvas.width * 1.0) / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          canvasCtx.lineTo(canvas.width, canvas.height / 2);
          canvasCtx.stroke();

          requestAnimationFrame(drawWaveform);
        };

        drawWaveform();
      } catch (error) {
        console.error('Error loading interviewer audio:', error);
      }
    };

    loadInterviewerAudio();
  }, []);

  // Handle interviewee's audio recording and waveform generation
  const startRecording = async () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);
    const mediaRecorderInstance = new MediaRecorder(stream);
    setMediaRecorder(mediaRecorderInstance);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = intervieweeCanvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    const drawWaveform = () => {
      const animation = requestAnimationFrame(drawWaveform); 
      setAnimationId(animation); 
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#FF6347';

      canvasCtx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    drawWaveform();
    setIsRecording(true);
    setShowRecordingText(true); // Show recording text when recording starts
    mediaRecorderInstance.start();
  };

  // Stop recording and freeze the waveform
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    setIsRecording(false);
    setShowRecordingText(false); // Hide recording text when recording stops
  };

  return (
    <div className="text-center mt-20 relative">
      <h1 className="text-4xl font-bold mb-8">Welcome, {location.state.name}. Let's start your interview!</h1>

      {/* Recording Audio Subheading */}
      {showRecordingText && (
        <div className="absolute top-0 left-0 text-red-600 font-bold text-lg animate-pulse px-4 py-2">
          Recording Audio
        </div>
      )}

      {/* Interviewer Section */}
      <h2 className="text-2xl font-semibold mb-4">Interviewer</h2>
      <div className="flex justify-center">
        <canvas ref={interviewerCanvasRef} width="600" height="150" className="border mb-5"></canvas>
      </div>

      {/* Interviewee Section */}
      <h2 className="text-2xl font-semibold mb-4">Interviewee</h2>
      <div className="flex justify-center">
        <canvas ref={intervieweeCanvasRef} width="600" height="150" className="border mb-5"></canvas>
      </div>

      {/* Start and Stop Recording Buttons */}
      <div className="flex justify-center">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Stop Recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="bg-green-500 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            Start Recording
          </button>
        )}
      </div>
    </div>
  );
}

export default InterviewPage;
