import { NextRequest, NextResponse } from 'next/server';

// Protege el tablero, el dashboard y el alta de profesores con usuario y contraseña (HTTP Basic).
// El webhook de WhatsApp no pasa por acá: Meta no envía estas credenciales.
// Es una protección provisoria; el paso siguiente es Supabase Auth.
export const config = {
  matcher: ['/asistencia/:path*', '/dashboard/:path*', '/api/staff/:path*'],
};

export function middleware(request: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const password = process.env.DASHBOARD_PASSWORD;
  if (!user || !password) {
    return new NextResponse('DASHBOARD_USER o DASHBOARD_PASSWORD no configurados', { status: 503 });
  }

  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(':');
    if (separator > -1 && decoded.slice(0, separator) === user && decoded.slice(separator + 1) === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Autenticación requerida', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Club Juntos"' },
  });
}
