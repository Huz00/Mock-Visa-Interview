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

  // Load and play interviewer's pre-recorded audio and show waveform
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const loadInterviewerAudio = async () => {
      try {
        const audioElement = new Audio('/assets/demo.wav'); // Ensure the correct file path

        audioElement.play(); // Auto-play the audio when the page is loaded

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

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

          requestAnimationFrame(drawWaveform); // Keep animating the waveform
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
      const animation = requestAnimationFrame(drawWaveform); // Store animation ID
      setAnimationId(animation); // Keep track of animation frame
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
  };

  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold mb-8">Welcome, {location.state.name}. Let's start your interview!</h1>

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

      {isRecording ? (
        <button onClick={stopRecording} className="bg-red-500 text-white px-4 py-2 rounded">Stop Recording</button>
      ) : (
        <button onClick={startRecording} className="bg-green-500 text-white px-4 py-2 rounded">Start Recording</button>
      )}
    </div>
  );
}

export default InterviewPage;
