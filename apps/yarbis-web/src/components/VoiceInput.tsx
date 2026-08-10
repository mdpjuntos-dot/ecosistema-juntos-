'use client';

import { useState, useRef } from 'react';

interface VoiceInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onSend, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });

        // Convert to base64
        const reader = new FileReader();
        reader.readAsArrayBuffer(audioBlob);
        reader.onloadend = async () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const base64 = Buffer.from(arrayBuffer).toString('base64');

          // Send to API
          try {
            const response = await fetch('/api/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, messages: [] }),
            });

            const data = await response.json();
            if (data.transcribedText) {
              setTranscript(data.transcribedText);
              onSend(data.transcribedText);
            }
          } catch (error) {
            console.error('Error sending audio:', error);
          }
        };

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se puede acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={handleVoiceClick}
        disabled={disabled}
        className={`p-3 rounded-full transition-colors ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : 'bg-yarbis-600 hover:bg-yarbis-700'
        } text-white disabled:opacity-50`}
        title={isRecording ? 'Dejar de grabar' : 'Grabar audio'}
      >
        {isRecording ? '🔴 Grabando' : '🎤'}
      </button>

      {transcript && (
        <span className="text-sm text-slate-400 flex-1 truncate">
          {transcript}
        </span>
      )}
    </div>
  );
}
