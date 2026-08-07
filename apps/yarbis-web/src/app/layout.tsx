import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yarbis - Tu Asistente AI de Club Juntos',
  description: 'Yarbis, tu asistente AI con onda para gestionar Club Juntos. Ingresa alumnos, genera recibos, maneja obras sociales y más.',
  keywords: ['Club Juntos', 'Yarbis', 'AI Assistant', 'Student Management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 min-h-screen">
        <div className="fixed inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
