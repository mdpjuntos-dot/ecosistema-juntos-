/**
 * Control de asistencia de profesores: registro, horarios y tablero del día.
 */
import { getSupabase } from './supabase';

export const TZ = 'America/Argentina/Buenos_Aires';

export type AttendanceStatus = 'presente' | 'tarde' | 'justificado' | 'ausente';

export interface Staff {
  id: string;
  legajo: string;
  firstName: string;
  lastName: string;
  dni: string;
  role: string;
  specialty: string | null;
  phone: string | null;
  active: boolean;
}

export interface Schedule {
  weekday: number; // 1 = lunes ... 7 = domingo
  startTime: string; // "HH:MM:SS"
  endTime: string;
}

export interface AttendanceRow {
  staffId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
}

export interface LocalNow {
  date: string; // YYYY-MM-DD en hora de Argentina
  weekday: number; // 1..7
  minutes: number; // minutos desde medianoche
}

export type BoardState = 'trabajando' | 'finalizó' | 'pendiente' | 'ausente' | 'justificado' | 'sin turno';

export interface BoardEntry {
  staff: Staff;
  schedule: Schedule | null;
  attendance: AttendanceRow | null;
  state: BoardState;
}

// ---- Tiempo y reglas puras (sin base de datos) ----

export function localNow(at: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(at);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dayNames: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: dayNames[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatHour(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function lateToleranceMinutes(): number {
  const raw = Number(process.env.STAFF_LATE_TOLERANCE_MINUTES ?? '10');
  return Number.isFinite(raw) && raw >= 0 ? raw : 10;
}

/** Llegó después de hora de inicio + tolerancia → tarde. */
export function checkInStatus(nowMinutes: number, startMinutes: number, tolerance: number): AttendanceStatus {
  return nowMinutes > startMinutes + tolerance ? 'tarde' : 'presente';
}

/** Normaliza teléfonos argentinos: WhatsApp envía 549..., la carga manual suele ser 54... */
export function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('549') ? '54' + digits.slice(3) : digits;
}

// ---- Acceso a datos ----

function mapStaff(row: any): Staff {
  return {
    id: row.id,
    legajo: row.legajo,
    firstName: row.first_name,
    lastName: row.last_name,
    dni: row.dni,
    role: row.role,
    specialty: row.specialty,
    phone: row.phone,
    active: row.active,
  };
}

function mapSchedule(row: any): Schedule {
  return { weekday: row.weekday, startTime: row.start_time, endTime: row.end_time };
}

function mapAttendance(row: any): AttendanceRow {
  return {
    staffId: row.staff_id,
    date: row.date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
  };
}

function check<T extends { error: any }>(result: T): T {
  if (result.error) throw new Error(result.error.message);
  return result;
}

export async function findStaffByPhone(phone: string): Promise<Staff | null> {
  const key = phoneKey(phone);
  const { data } = check(
    await getSupabase().from('staff').select('*').eq('active', true)
  );
  const row = (data ?? []).find((r: any) => r.phone && phoneKey(r.phone) === key);
  return row ? mapStaff(row) : null;
}

export async function getTodaySchedule(staffId: string, weekday: number): Promise<Schedule | null> {
  const { data } = check(
    await getSupabase()
      .from('staff_schedules')
      .select('*')
      .eq('staff_id', staffId)
      .eq('weekday', weekday)
      .maybeSingle()
  );
  return data ? mapSchedule(data) : null;
}

async function getAttendance(staffId: string, date: string): Promise<AttendanceRow | null> {
  const { data } = check(
    await getSupabase().from('attendance').select('*').eq('staff_id', staffId).eq('date', date).maybeSingle()
  );
  return data ? mapAttendance(data) : null;
}

export async function registerCheckIn(staff: Staff, at: Date = new Date()): Promise<string> {
  const now = localNow(at);
  const existing = await getAttendance(staff.id, now.date);
  if (existing?.checkIn) {
    return `Ya tenías registrada la entrada hoy a las ${formatHour(existing.checkIn)}.`;
  }

  const schedule = await getTodaySchedule(staff.id, now.weekday);
  const status = schedule
    ? checkInStatus(now.minutes, toMinutes(schedule.startTime), lateToleranceMinutes())
    : 'presente';

  check(
    await getSupabase()
      .from('attendance')
      .upsert(
        {
          staff_id: staff.id,
          date: now.date,
          check_in: at.toISOString(),
          status,
          channel: 'whatsapp',
        },
        { onConflict: 'staff_id,date' }
      )
  );

  const hour = formatHour(at.toISOString());
  if (!schedule) return `Entrada registrada a las ${hour}. Hoy no tenés turno asignado.`;
  return status === 'tarde'
    ? `Entrada registrada a las ${hour}. Llegaste tarde, tu turno empezaba a las ${schedule.startTime.slice(0, 5)}.`
    : `Entrada registrada a las ${hour}. ¡Buen turno!`;
}

export async function registerCheckOut(staff: Staff, at: Date = new Date()): Promise<string> {
  const now = localNow(at);
  const existing = await getAttendance(staff.id, now.date);
  if (!existing?.checkIn) return 'Todavía no registraste tu entrada hoy.';
  if (existing.checkOut) return `Ya registraste la salida hoy a las ${formatHour(existing.checkOut)}.`;

  check(
    await getSupabase()
      .from('attendance')
      .update({ check_out: at.toISOString() })
      .eq('staff_id', staff.id)
      .eq('date', now.date)
  );

  const hours = (at.getTime() - new Date(existing.checkIn).getTime()) / 3_600_000;
  return `Salida registrada a las ${formatHour(at.toISOString())}. Trabajaste ${hours.toFixed(1)} h.`;
}

export async function describeToday(staff: Staff, at: Date = new Date()): Promise<string> {
  const now = localNow(at);
  const schedule = await getTodaySchedule(staff.id, now.weekday);
  const att = await getAttendance(staff.id, now.date);

  const turno = schedule
    ? `Turno: ${schedule.startTime.slice(0, 5)} a ${schedule.endTime.slice(0, 5)}`
    : 'Hoy no tenés turno asignado';
  const fichaje = att?.checkIn
    ? `Entrada ${formatHour(att.checkIn)}${att.checkOut ? `, salida ${formatHour(att.checkOut)}` : ' (trabajando)'}`
    : 'Sin entrada registrada';
  return `${staff.firstName} ${staff.lastName} (${staff.legajo})\n${turno}\n${fichaje}`;
}

/** Falta justificada: el profesor avisa que no viene hoy. */
export async function registerJustification(staff: Staff, at: Date = new Date()): Promise<string> {
  const now = localNow(at);
  const existing = await getAttendance(staff.id, now.date);
  if (existing?.checkIn) {
    return `Ya fichaste la entrada hoy a las ${formatHour(existing.checkIn)}, no hace falta justificar.`;
  }

  check(
    await getSupabase()
      .from('attendance')
      .upsert({ staff_id: staff.id, date: now.date, status: 'justificado', channel: 'whatsapp' }, { onConflict: 'staff_id,date' })
  );
  return 'Falta justificada registrada para hoy. Gracias por avisar.';
}

function weekdayOf(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const cursor = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export interface StaffMetric {
  staff: Staff;
  expected: number; // turnos del período que ya debieron cumplirse
  presentes: number;
  tardanzas: number;
  ausencias: number;
  justificadas: number;
  puntualidad: number | null; // % de turnos cumplidos a horario
}

export interface MetricsReport {
  from: string;
  to: string;
  rows: StaffMetric[];
  totals: { expected: number; presentes: number; tardanzas: number; ausencias: number; justificadas: number; asistencia: number | null };
}

/** Métricas por profesor entre dos fechas (YYYY-MM-DD), según su horario fijo. */
export async function getMetrics(from: string, to: string): Promise<MetricsReport> {
  const db = getSupabase();
  const today = localNow();

  const [staffRes, schedRes, attRes] = await Promise.all([
    db.from('staff').select('*').eq('active', true).order('legajo'),
    db.from('staff_schedules').select('*'),
    db.from('attendance').select('*').gte('date', from).lte('date', to),
  ]);

  const schedules = new Map<string, Schedule>();
  for (const row of check(schedRes).data ?? []) schedules.set(`${row.staff_id}:${row.weekday}`, mapSchedule(row));
  const attendance = new Map<string, AttendanceRow>();
  for (const row of check(attRes).data ?? []) attendance.set(`${row.staff_id}:${row.date}`, mapAttendance(row));

  const dates = datesBetween(from, to);

  const rows: StaffMetric[] = (check(staffRes).data ?? []).map((row: any) => {
    const staff = mapStaff(row);
    const m: StaffMetric = { staff, expected: 0, presentes: 0, tardanzas: 0, ausencias: 0, justificadas: 0, puntualidad: null };
    let onTime = 0;

    for (const date of dates) {
      if (date > today.date) break;
      const schedule = schedules.get(`${staff.id}:${weekdayOf(date)}`);
      if (!schedule) continue;

      const att = attendance.get(`${staff.id}:${date}`);
      if (att?.checkIn) {
        m.expected++;
        m.presentes++;
        if (att.status === 'tarde') m.tardanzas++;
        else onTime++;
      } else if (att?.status === 'justificado') {
        m.expected++;
        m.justificadas++;
      } else if (date === today.date && today.minutes <= toMinutes(schedule.endTime)) {
        // El turno de hoy todavía no terminó: no cuenta como ausencia
        continue;
      } else {
        m.expected++;
        m.ausencias++;
      }
    }

    m.puntualidad = m.expected ? Math.round((onTime / m.expected) * 100) : null;
    return m;
  });

  rows.sort((a, b) => b.ausencias - a.ausencias || a.staff.lastName.localeCompare(b.staff.lastName));

  const sum = (fn: (r: StaffMetric) => number) => rows.reduce((acc, r) => acc + fn(r), 0);
  const expected = sum((r) => r.expected);
  const presentes = sum((r) => r.presentes);
  return {
    from,
    to,
    rows,
    totals: {
      expected,
      presentes,
      tardanzas: sum((r) => r.tardanzas),
      ausencias: sum((r) => r.ausencias),
      justificadas: sum((r) => r.justificadas),
      asistencia: expected ? Math.round((presentes / expected) * 100) : null,
    },
  };
}

export async function createStaff(input: {
  firstName: string;
  lastName: string;
  dni: string;
  role: string;
  specialty?: string;
  phone?: string;
  schedules: { weekday: number; startTime: string; endTime: string }[];
}): Promise<Staff> {
  const db = getSupabase();
  const { data } = check(
    await db
      .from('staff')
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        dni: input.dni,
        role: input.role,
        specialty: input.specialty ?? null,
        phone: input.phone ? phoneKey(input.phone) : null,
      })
      .select('*')
      .single()
  );

  if (input.schedules.length > 0) {
    check(
      await db.from('staff_schedules').insert(
        input.schedules.map((s) => ({
          staff_id: data.id,
          weekday: s.weekday,
          start_time: s.startTime,
          end_time: s.endTime,
        }))
      )
    );
  }
  return mapStaff(data);
}

export async function listStaff(): Promise<Staff[]> {
  const { data } = check(await getSupabase().from('staff').select('*').order('legajo'));
  return (data ?? []).map(mapStaff);
}

/** Tablero del día: cada profesor activo con su turno, fichaje y estado. */
export async function getTodayBoard(at: Date = new Date()): Promise<{
  date: string;
  entries: BoardEntry[];
  kpis: { presentes: number; trabajando: number; tardanzas: number; pendientes: number; ausentes: number };
}> {
  const now = localNow(at);
  const db = getSupabase();

  const [staffRes, schedRes, attRes] = await Promise.all([
    db.from('staff').select('*').eq('active', true).order('last_name'),
    db.from('staff_schedules').select('*').eq('weekday', now.weekday),
    db.from('attendance').select('*').eq('date', now.date),
  ]);
  const staffList = check(staffRes).data ?? [];
  const schedules = new Map<string, Schedule>();
  for (const row of check(schedRes).data ?? []) schedules.set(row.staff_id, mapSchedule(row));
  const attendance = new Map<string, AttendanceRow>();
  for (const row of check(attRes).data ?? []) attendance.set(row.staff_id, mapAttendance(row));

  const entries: BoardEntry[] = staffList.map((row: any) => {
    const staff = mapStaff(row);
    const schedule = schedules.get(staff.id) ?? null;
    const att = attendance.get(staff.id) ?? null;

    let state: BoardState;
    if (att?.checkOut) state = 'finalizó';
    else if (att?.checkIn) state = 'trabajando';
    else if (att?.status === 'justificado') state = 'justificado';
    else if (!schedule) state = 'sin turno';
    else if (now.minutes > toMinutes(schedule.endTime)) state = 'ausente';
    else state = 'pendiente';

    return { staff, schedule, attendance: att, state };
  });

  return {
    date: now.date,
    entries,
    kpis: {
      presentes: entries.filter((e) => e.attendance?.checkIn).length,
      trabajando: entries.filter((e) => e.state === 'trabajando').length,
      tardanzas: entries.filter((e) => e.attendance?.status === 'tarde').length,
      pendientes: entries.filter((e) => e.state === 'pendiente').length,
      ausentes: entries.filter((e) => e.state === 'ausente').length,
    },
  };
}
