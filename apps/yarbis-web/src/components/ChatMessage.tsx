'use client';

import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
  formType?: string;
}

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

export default function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}
      key={message.id}
    >
      <div
        className={`max-w-md lg:max-w-xl px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-yarbis-600 text-white rounded-br-none'
            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </div>
        <div className={`text-xs mt-1 ${isUser ? 'text-yarbis-100' : 'text-slate-500'}`}>
          {message.timestamp.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
