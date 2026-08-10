'use client';

import { useState, useRef } from 'react';
import VoiceInput from './VoiceInput';

interface InputFieldProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function InputField({ onSend, disabled }: InputFieldProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleVoiceSend = (text: string) => {
    onSend(text);
    setInput('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 border-t border-slate-700 p-4 space-y-3"
    >
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu solicitud... (ej: ingresar alumno nuevo)"
          disabled={disabled}
          className="flex-1 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded px-4 py-2 focus:outline-none focus:border-yarbis-500 focus:ring-1 focus:ring-yarbis-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-yarbis-600 hover:bg-yarbis-700 disabled:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors"
        >
          {disabled ? '⏳' : '✉️'}
        </button>
      </div>

      <div className="flex gap-2 items-center bg-slate-700 p-2 rounded">
        <VoiceInput onSend={handleVoiceSend} disabled={disabled} />
        <span className="text-xs text-slate-400 flex-1">
          O presiona 🎤 para hablar
        </span>
      </div>

      <p className="text-xs text-slate-400">
        💡 Tip: Escribí "ayuda" para ver comandos | 🎤 Audio también funciona
      </p>
    </form>
  );
}
