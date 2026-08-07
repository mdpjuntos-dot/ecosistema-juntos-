import ChatWindow from '@/components/ChatWindow';

export default function Home() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yarbis-600 to-yarbis-700 shadow-lg border-b border-yarbis-500">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Yarbis</h1>
              <p className="text-yarbis-100 text-sm">Tu asistente AI de Club Juntos</p>
            </div>
          </div>
          <div className="text-sm text-yarbis-100">
            v0.1.0
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden bg-slate-900">
        <ChatWindow />
      </div>

      {/* Footer */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 text-center text-sm text-slate-400">
        <p>Made with 💜 for Club Juntos</p>
      </div>
    </div>
  );
}
