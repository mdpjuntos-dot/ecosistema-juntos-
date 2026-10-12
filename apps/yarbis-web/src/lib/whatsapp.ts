/**
 * WhatsApp Cloud API helpers (Meta).
 * Verifies webhook signatures, extracts incoming text messages and sends replies.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export interface IncomingWhatsAppText {
  from: string; // número en formato internacional sin "+", ej. 5492236123456
  text: string;
  messageId: string;
}

const GRAPH_API_VERSION = 'v21.0';

export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function extractTextMessages(payload: any): IncomingWhatsAppText[] {
  const messages: IncomingWhatsAppText[] = [];

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const msg of change?.value?.messages ?? []) {
        if (msg.type === 'text' && msg.text?.body) {
          messages.push({
            from: String(msg.from),
            text: String(msg.text.body),
            messageId: String(msg.id),
          });
        }
      }
    }
  }

  return messages;
}

export function isStaffPhone(phone: string): boolean {
  const allowed = (process.env.WHATSAPP_STAFF_PHONES ?? '')
    .split(',')
    .map((p) => p.replace(/\D/g, ''))
    .filter(Boolean);
  return allowed.includes(phone.replace(/\D/g, ''));
}

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error('WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados');
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${detail}`);
  }
}
