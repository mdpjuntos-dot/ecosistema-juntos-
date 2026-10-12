/**
 * Comandos de asistencia por WhatsApp.
 *
 *   presente <nombre>     → marca presente hoy
 *   ausente <nombre>      → marca ausente hoy
 *   justificado <nombre>  → marca ausente justificado hoy
 *   asistencia hoy        → resumen de hoy
 *   ayuda                 → lista de comandos
 */
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

// Coincidencia exacta del nombre completo o de nombre + apellido.
// Devuelve null si no hay coincidencia o si es ambigua.
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

export function handleAttendanceCommand(text: string): string {
  const input = text.trim();
  const lower = normalize(input);

  if (lower === 'ayuda' || lower === 'help' || lower === 'hola') {
    return (
      '👋 Hola, soy el bot de asistencia de Club Juntos.\n\n' +
      'Comandos:\n' +
      '• presente <nombre y apellido>\n' +
      '• ausente <nombre y apellido>\n' +
      '• justificado <nombre y apellido>\n' +
      '• asistencia hoy'
    );
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

  const { student, candidates } = resolveStudent(name);
  if (!student) {
    if (candidates.length > 1) {
      return `Hay varios alumnos con ese nombre (${candidates.length}). Escribí nombre y apellido completos.`;
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
