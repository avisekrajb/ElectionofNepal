import React, { useState, useEffect, useRef } from 'react';
import './VoiceSearch.css';

const VoiceSearch = ({ onVoiceResult, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Check if browser supports speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      startAudioVisualizer();
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      
      // If we have a final result, trigger the callback
      if (finalTranscript) {
        onVoiceResult(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your microphone settings.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
          break;
        case 'network':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError(`Error: ${event.error}. Please try again.`);
      }
      
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
      stopAudioVisualizer();
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioVisualizer();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onVoiceResult]);

  // Initialize audio visualizer
  const initAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;

      javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const values = array.reduce((a, b) => a + b);
        const average = values / array.length;
        setVolume(Math.min(average / 100, 1)); // Normalize to 0-1
      };
    } catch (err) {
      console.error('Audio visualizer error:', err);
    }
  };

  const startAudioVisualizer = async () => {
    await initAudioVisualizer();
    
    const updateVisualizer = () => {
      if (isListening && analyserRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      }
    };
    
    updateVisualizer();
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    setVolume(0);
  };

  const startListening = () => {
    if (disabled || !isSupported) return;
    
    setError('');
    setTranscript('');
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start voice search. Please try again.');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePermissionRequest = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setError('');
        setIsSupported(true);
        startListening();
      })
      .catch((err) => {
        console.error('Permission denied:', err);
        setError('Microphone permission is required for voice search.');
      });
  };

  if (!isSupported && error) {
    return (
      <div className="voice-search-error">
        <div className="error-icon">🎤</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="voice-search-container">
      {/* Voice search button */}
      <button
        type="button"
        className={`voice-search-button ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Start voice search'}
        aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
      >
        {/* Animated microphone icon */}
        <div className="microphone-container">
          <div className="microphone-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          
          {/* Audio visualization */}
          {isListening && (
            <div className="audio-visualizer">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="audio-bar"
                  style={{
                    height: `${volume * 100}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Status indicator */}
      {isListening && (
        <div className="voice-status">
          <div className="listening-indicator">
            <span className="pulsing-dot" />
            <span className="status-text">Listening...</span>
          </div>
          
          {transcript && (
            <div className="transcript-preview">
              <span className="transcript-label">You said:</span>
              <span className="transcript-text">{transcript}</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="voice-error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          {error.includes('permission') && (
            <button
              className="permission-retry-btn"
              onClick={handlePermissionRequest}
            >
              Grant Permission
            </button>
          )}
        </div>
      )}

      {/* Voice instructions tooltip (only on hover) */}
      <div className="voice-instructions">
        <div className="instructions-icon">ℹ️</div>
        <div className="instructions-content">
          <p><strong>Voice Search Tips:</strong></p>
          <ul>
            <li>Say candidate names like "Gagan Thapa" or "Balen"</li>
            <li>Say party names like "Nepali Congress" or "Rastriya Swatantra"</li>
            <li>Speak clearly and at a normal pace</li>
            <li>Make sure your microphone is working</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearch;