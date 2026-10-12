import { NextRequest, NextResponse } from 'next/server';
import { handleAttendanceCommand } from '@/lib/attendance-bot';
import {
  extractTextMessages,
  isStaffPhone,
  sendWhatsAppText,
  verifySignature,
} from '@/lib/whatsapp';

// Verificación del webhook (Meta envía hub.mode, hub.verify_token y hub.challenge)
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// Mensajes entrantes
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad JSON', { status: 400 });
  }

  // Meta reintenta si no recibe 200, así que siempre respondemos 200 y procesamos aparte.
  for (const msg of extractTextMessages(payload)) {
    if (!isStaffPhone(msg.from)) {
      console.warn(`WhatsApp: mensaje de número no autorizado ${msg.from}`);
      continue;
    }

    try {
      const reply = handleAttendanceCommand(msg.text);
      await sendWhatsAppText(msg.from, reply);
    } catch (error) {
      console.error('Error procesando mensaje de WhatsApp:', error);
    }
  }

  return NextResponse.json({ received: true });
}
