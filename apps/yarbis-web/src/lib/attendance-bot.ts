/**
 * Bot de asistencia por WhatsApp.
 *
 * Entiende mensajes en lenguaje natural (vía Claude) y, si no hay API disponible,
 * cae a comandos fijos:
 *
 *   presente <nombre>     → marca presente hoy
 *   ausente <nombre>      → marca ausente hoy
 *   justificado <nombre>  → marca ausente justificado hoy
 *   asistencia hoy        → resumen de hoy
 *   ayuda                 → lista de comandos
 */
import Anthropic from '@anthropic-ai/sdk';
import { getDatabase, Student, AttendanceRecord } from './database';

type Status = AttendanceRecord['status'];

const STATUS_BY_COMMAND: Record<string, Status> = {
  presente: 'present',
  ausente: 'absent',
  justificado: 'justified',
};

const STATUS_LABEL: Record<Status, string> = {
  present: 'presente ✅',
  absent: 'ausente ❌',
  justified: 'ausente justificado 📝',
};

const HELP_TEXT =
  '👋 Hola, soy el bot de asistencia de Club Juntos.\n\n' +
  'Podés escribirme normal, por ejemplo:\n' +
  '• "Juan Pérez vino hoy"\n' +
  '• "Ana García faltó, Lucas López avisó que no viene"\n' +
  '• "¿Cómo va la asistencia de hoy?"\n\n' +
  'O usar comandos:\n' +
  '• presente <nombre y apellido>\n' +
  '• ausente <nombre y apellido>\n' +
  '• justificado <nombre y apellido>\n' +
  '• asistencia hoy';

export function todayISO(): string {
  // Fecha local de Mar del Plata (YYYY-MM-DD)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Coincidencia exacta del nombre completo o apellido + nombre.
// Devuelve el alumno solo si hay exactamente uno.
function resolveStudent(query: string): { student?: Student; candidates: Student[] } {
  const q = normalize(query);
  const all = getDatabase().getAllStudents();

  const candidates = all.filter((s) => {
    const full = normalize(`${s.firstName} ${s.lastName}`);
    const reversed = normalize(`${s.lastName} ${s.firstName}`);
    return q === full || q === reversed;
  });

  return candidates.length === 1 ? { student: candidates[0], candidates } : { candidates };
}

function markAttendance(name: string, status: Status): string {
  const { student, candidates } = resolveStudent(name);
  if (!student) {
    if (candidates.length > 1) {
      return `Hay varios alumnos con el nombre "${name}". Escribí nombre y apellido completos.`;
    }
    return `No encontré un alumno llamado "${name}". Revisá el nombre o cargalo en el sistema.`;
  }

  const date = todayISO();
  getDatabase().setAttendance(student.id, date, status);
  return `${student.firstName} ${student.lastName}: ${STATUS_LABEL[status]} (${date})`;
}

function buildTodaySummary(): string {
  const db = getDatabase();
  const today = todayISO();
  const records = db.getAttendanceByDate(today);

  if (records.length === 0) {
    return `Todavía no hay asistencia registrada para hoy (${today}).`;
  }

  const count = (s: Status) => records.filter((r) => r.status === s).length;
  const lines = records.map((r) => {
    const s = db.getStudent(r.studentId);
    const name = s ? `${s.firstName} ${s.lastName}` : r.studentId;
    return `• ${name}: ${STATUS_LABEL[r.status]}`;
  });

  return (
    `📊 Asistencia de hoy (${today})\n` +
    `Presentes: ${count('present')} · Ausentes: ${count('absent')} · Justificados: ${count('justified')}\n\n` +
    lines.join('\n')
  );
}

/** Comandos fijos. Se usa como respaldo si Claude no está disponible. */
export function handleAttendanceCommand(text: string): string {
  const input = text.trim();
  const lower = normalize(input);

  if (lower === 'ayuda' || lower === 'help' || lower === 'hola') {
    return HELP_TEXT;
  }

  if (lower === 'asistencia hoy') {
    return buildTodaySummary();
  }

  const [command, ...rest] = input.split(/\s+/);
  const status = STATUS_BY_COMMAND[normalize(command)];
  if (!status) {
    return 'No entendí el comando. Escribí "ayuda" para ver las opciones.';
  }

  const name = rest.join(' ').trim();
  if (!name) {
    return `Falta el nombre del alumno. Ejemplo: ${normalize(command)} Juan Pérez`;
  }

  return markAttendance(name, status);
}

// ---- Lenguaje natural ----

const ATTENDANCE_TOOL: Anthropic.Tool = {
  name: 'registrar_asistencia',
  description:
    'Registra la asistencia de hoy de uno o más alumnos y/o pide el resumen del día. ' +
    'Usala siempre que el mensaje indique quién vino, faltó o justificó. ' +
    'Si el mensaje no tiene que ver con asistencia, dejá marks vacío y respondé en "reply".',
  input_schema: {
    type: 'object',
    properties: {
      marks: {
        type: 'array',
        description: 'Alumnos a registrar para hoy.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nombre y apellido tal como aparece en el listado.' },
            status: { type: 'string', enum: ['present', 'absent', 'justified'] },
          },
          required: ['name', 'status'],
        },
      },
      wants_summary: {
        type: 'boolean',
        description: 'true si el usuario pide ver el resumen o estado de asistencia de hoy.',
      },
      reply: {
        type: 'string',
        description: 'Respuesta corta en español rioplatense, solo si no hay marks ni resumen para mostrar.',
      },
    },
    required: ['marks', 'wants_summary'],
  },
};

const SYSTEM_PROMPT = `Sos el bot de asistencia de Club Juntos (Mar del Plata). Hablás en español rioplatense, con tono amable y breve.
Interpretás mensajes del staff sobre asistencia de hoy: quién vino (present), quién faltó (absent) y quién faltó con aviso o justificación (justified).
Usá la herramienta registrar_asistencia. Usá los nombres tal como aparecen en el listado de alumnos.
Si el mensaje es ambiguo, no lo registres y pedí aclaración en "reply".

Alumnos del listado:
{ROSTER}`;

interface NluResult {
  marks: { name: string; status: Status }[];
  wants_summary: boolean;
  reply?: string;
}

function rosterNames(): string {
  return getDatabase()
    .getAllStudents()
    .map((s) => `- ${s.firstName} ${s.lastName}`)
    .join('\n');
}

async function interpretWithClaude(text: string): Promise<NluResult> {
  const model = process.env.ANTHROPIC_ATTENDANCE_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) {
    throw new Error('ANTHROPIC_API_KEY o ANTHROPIC_ATTENDANCE_MODEL no configurados');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model,
    max_tokens: 512,
    system: SYSTEM_PROMPT.replace('{ROSTER}', rosterNames() || '(sin alumnos cargados)'),
    tools: [ATTENDANCE_TOOL],
    tool_choice: { type: 'tool', name: ATTENDANCE_TOOL.name },
    messages: [{ role: 'user', content: text }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude no devolvió una acción de asistencia');
  }
  return toolUse.input as NluResult;
}

/** Punto de entrada del bot: lenguaje natural con respaldo a comandos. */
export async function handleAttendanceMessage(text: string): Promise<string> {
  // Los comandos exactos no necesitan pasar por Claude
  const normalized = normalize(text);
  if (/^(ayuda|help|hola|asistencia hoy)$/.test(normalized) || /^(presente|ausente|justificado)\s+\S/.test(normalized)) {
    return handleAttendanceCommand(text);
  }

  try {
    const result = await interpretWithClaude(text);
    const parts: string[] = [];

    for (const mark of result.marks ?? []) {
      parts.push(markAttendance(mark.name, mark.status));
    }
    if (result.wants_summary) {
      parts.push(buildTodaySummary());
    }
    if (parts.length === 0) {
      parts.push(result.reply || HELP_TEXT);
    }
    return parts.join('\n\n');
  } catch (error) {
    console.error('Asistencia: fallback a comandos fijos:', error);
    return handleAttendanceCommand(text);
  }
}
