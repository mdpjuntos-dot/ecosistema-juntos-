'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import InputField from './InputField';
import CommandPalette from './CommandPalette';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
  formType?: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Ey! Yo soy Yarbis, tu AI con onda 🤖\n\n¿Qué necesitás hacer hoy? Puedo ayudarte con:\n• Ingresar alumnos nuevos\n• Generar recibos\n• Completar formularios de obras sociales\n• Crear planillas de asistencia\n\n¿Vamos a empezar?',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: text,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content,
        timestamp: new Date(),
        action: data.action,
        formType: data.formType,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Uh, metí la pata 😅 No pude procesar tu solicitud. Intentá de nuevo, boludo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.map((message, index) => (
          <ChatMessage key={message.id} message={message} isLast={index === messages.length - 1} />
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-slate-400">
            <div className="typing-indicator flex gap-1">
              <span className="inline-block w-2 h-2 bg-yarbis-500 rounded-full"></span>
              <span className="inline-block w-2 h-2 bg-yarbis-500 rounded-full"></span>
              <span className="inline-block w-2 h-2 bg-yarbis-500 rounded-full"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 py-4 border-t border-slate-700 bg-slate-800">
          <p className="text-xs text-slate-400 mb-3">Acciones rápidas:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction('Ingresar alumno nuevo')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              📝 Nuevo Alumno
            </button>
            <button
              onClick={() => handleQuickAction('Generar recibo')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              💰 Recibos
            </button>
            <button
              onClick={() => handleQuickAction('Completar obra social')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              📋 Obras Sociales
            </button>
            <button
              onClick={() => handleQuickAction('Crear planilla de asistencia')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              📊 Planilla
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <InputField onSend={sendMessage} disabled={loading} />
    </div>
  );
}
