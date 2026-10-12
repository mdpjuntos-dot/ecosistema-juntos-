/**
 * Bot de fichaje por WhatsApp para profesores.
 * Identifica al profesor por su número. Solo puede fichar para sí mismo.
 *
 * Comandos: entrada | salida | estado | ayuda
 * También entiende frases libres ("llegué", "me voy") vía Claude, si está configurado.
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  Staff,
  describeToday,
  findStaffByPhone,
  registerCheckIn,
  registerCheckOut,
  registerJustification,
} from './staff-attendance';

type Action = 'entrada' | 'salida' | 'justificar' | 'estado' | 'ayuda';

const HELP_TEXT =
  '👋 Hola, soy el bot de asistencia de Club Juntos.\n\n' +
  'Comandos:\n' +
  '• entrada: registra tu llegada\n' +
  '• salida: registra tu salida\n' +
  '• justifico: avisás que no venís hoy (falta justificada)\n' +
  '• estado: muestra tu turno y fichaje de hoy\n\n' +
  'También podés escribir normal, por ejemplo "llegué" o "me voy".';

const NOT_REGISTERED =
  'Tu número no está registrado como profesor del club. Pedile el alta a coordinación.';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const COMMANDS: Record<string, Action> = {
  entrada: 'entrada',
  entre: 'entrada',
  llegue: 'entrada',
  salida: 'salida',
  'me voy': 'salida',
  justifico: 'justificar',
  'no voy': 'justificar',
  'falta justificada': 'justificar',
  estado: 'estado',
  ayuda: 'ayuda',
  help: 'ayuda',
  hola: 'ayuda',
};

export function parseCommand(text: string): Action | null {
  return COMMANDS[normalize(text)] ?? null;
}

const ACTION_TOOL: Anthropic.Tool = {
  name: 'accion_fichaje',
  description:
    'Indica qué quiere hacer el profesor con su fichaje de hoy. ' +
    'entrada = llegó o empieza el turno; salida = se retira o terminó el turno; ' +
    'justificar = avisa que no viene hoy por una causa (falta justificada); ' +
    'estado = pregunta por su turno o fichaje; ayuda = pide instrucciones; ' +
    'otro = el mensaje no tiene que ver con fichajes (respondé en "reply").',
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['entrada', 'salida', 'justificar', 'estado', 'ayuda', 'otro'] },
      reply: { type: 'string', description: 'Respuesta corta en español rioplatense, solo si action es "otro".' },
    },
    required: ['action'],
  },
};

const SYSTEM_PROMPT =
  'Sos el bot de fichaje de profesores de Club Juntos (Mar del Plata). Hablás en español rioplatense, breve y amable. ' +
  'Interpretá el mensaje del profesor y usá la herramienta accion_fichaje.';

async function interpretWithClaude(text: string): Promise<{ action: string; reply?: string }> {
  const model = process.env.ANTHROPIC_ATTENDANCE_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) {
    throw new Error('ANTHROPIC_API_KEY o ANTHROPIC_ATTENDANCE_MODEL no configurados');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    tools: [ACTION_TOOL],
    tool_choice: { type: 'tool', name: ACTION_TOOL.name },
    messages: [{ role: 'user', content: text }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude no devolvió una acción de fichaje');
  }
  return toolUse.input as { action: string; reply?: string };
}

async function run(action: Action, staff: Staff): Promise<string> {
  switch (action) {
    case 'entrada':
      return registerCheckIn(staff);
    case 'salida':
      return registerCheckOut(staff);
    case 'justificar':
      return registerJustification(staff);
    case 'estado':
      return describeToday(staff);
    case 'ayuda':
      return HELP_TEXT;
  }
}

/** Punto de entrada: recibe el número del remitente y su texto. */
export async function handleStaffMessage(from: string, text: string): Promise<string> {
  const staff = await findStaffByPhone(from);
  if (!staff) return NOT_REGISTERED;

  const command = parseCommand(text);
  if (command) return run(command, staff);

  try {
    const result = await interpretWithClaude(text);
    if (result.action === 'otro') return result.reply || HELP_TEXT;
    return run(result.action as Action, staff);
  } catch (error) {
    console.error('Fichaje: sin interpretación, muestro ayuda:', error);
    return HELP_TEXT;
  }
}
