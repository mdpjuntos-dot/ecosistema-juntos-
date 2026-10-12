import { NextRequest, NextResponse } from 'next/server';
import { createStaff, listStaff } from '@/lib/staff-attendance';

// Alta y listado de profesores. Requiere la clave de administrador en el header x-admin-key.
function isAuthorized(request: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return new NextResponse('ADMIN_API_KEY no configurada', { status: 503 });
  if (request.headers.get('x-admin-key') !== expected) return new NextResponse('Unauthorized', { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  const denied = isAuthorized(request);
  if (denied) return denied;
  return NextResponse.json({ staff: await listStaff() });
}

export async function POST(request: NextRequest) {
  const denied = isAuthorized(request);
  if (denied) return denied;

  const body = await request.json();
  const required = ['firstName', 'lastName', 'dni', 'role'];
  const missing = required.filter((k) => !body?.[k]);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Faltan campos: ${missing.join(', ')}` }, { status: 400 });
  }

  const schedules = Array.isArray(body.schedules) ? body.schedules : [];
  for (const s of schedules) {
    const valid =
      Number.isInteger(s.weekday) &&
      s.weekday >= 1 &&
      s.weekday <= 7 &&
      /^\d{2}:\d{2}$/.test(s.startTime) &&
      /^\d{2}:\d{2}$/.test(s.endTime) &&
      s.endTime > s.startTime;
    if (!valid) {
      return NextResponse.json({ error: 'Horario inválido: weekday 1-7, startTime < endTime (HH:MM)' }, { status: 400 });
    }
  }

  try {
    const staff = await createStaff({ ...body, schedules });
    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
