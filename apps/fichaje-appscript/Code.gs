/**
 * Club Juntos – fichaje de profesores con Google Apps Script.
 * Base de datos: la planilla con las hojas Profesores, Horarios y Fichajes.
 * Lógica pura (probada en test/logic.test.js) arriba; acceso a la planilla abajo.
 */

const TZ = 'America/Argentina/Buenos_Aires';
const SHEET = { STAFF: 'Profesores', SCHEDULES: 'Horarios', EVENTS: 'Fichajes' };
const DEFAULT_TOLERANCE_MINUTES = 10;

// ---------------------------------------------------------------------------
// Lógica pura
// ---------------------------------------------------------------------------

/** 1 = lunes ... 7 = domingo, para una fecha YYYY-MM-DD. */
function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  return day === 0 ? 7 : day;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Llegó después de inicio + tolerancia → tarde. */
function checkInStatus(nowMinutes, startMinutes, tolerance) {
  return nowMinutes > startMinutes + tolerance ? 'tarde' : 'presente';
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function datesBetween(from, to) {
  const out = [];
  for (let cur = from; cur <= to; cur = addDays(cur, 1)) out.push(cur);
  return out;
}

/**
 * Métricas por profesor entre dos fechas.
 * input: { from, to, today, nowMinutes, staff[], schedules[], events[] }
 *   staff:     { legajo, nombre, apellido, rol, desde }   (desde = YYYY-MM-DD o '')
 *   schedules: { legajo, weekday, start, end }            (HH:mm)
 *   events:    { date, legajo, evento: 'entrada'|'salida'|'justificar', estado }
 */
function computeMetrics(input) {
  const schedules = new Map(input.schedules.map((s) => [s.legajo + ':' + s.weekday, s]));
  const days = indexEventsByDay(input.events);

  const rows = input.staff.map((p) => {
    const row = {
      legajo: p.legajo, nombre: p.nombre, apellido: p.apellido, rol: p.rol,
      expected: 0, presentes: 0, tardanzas: 0, ausencias: 0, justificadas: 0, puntualidad: null,
    };
    let onTime = 0;

    for (const date of datesBetween(input.from, input.to)) {
      if (date > input.today) break;
      if (p.desde && date < p.desde) continue; // antes del alta no hay nada que evaluar
      const sched = schedules.get(p.legajo + ':' + weekdayOf(date));
      if (!sched) continue;

      const day = days.get(p.legajo + '|' + date);
      if (day && day.entrada) {
        row.expected++;
        row.presentes++;
        if (day.entrada === 'tarde') row.tardanzas++;
        else onTime++;
      } else if (day && day.justificado) {
        row.expected++;
        row.justificadas++;
      } else if (date === input.today && input.nowMinutes <= toMinutes(sched.end)) {
        continue; // el turno de hoy todavía no terminó
      } else {
        row.expected++;
        row.ausencias++;
      }
    }

    row.puntualidad = row.expected ? Math.round((onTime / row.expected) * 100) : null;
    return row;
  });

  rows.sort((a, b) => b.ausencias - a.ausencias || a.apellido.localeCompare(b.apellido));

  const sum = (fn) => rows.reduce((acc, r) => acc + fn(r), 0);
  const expected = sum((r) => r.expected);
  const presentes = sum((r) => r.presentes);
  return {
    from: input.from,
    to: input.to,
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

/** Tablero de hoy: estado de cada profesor y KPIs. */
function computeBoard(input) {
  const weekday = weekdayOf(input.date);
  const schedules = new Map(input.schedules.filter((s) => s.weekday === weekday).map((s) => [s.legajo, s]));
  const days = indexEventsByDay(input.events);

  const entries = input.staff.map((p) => {
    const sched = schedules.get(p.legajo) || null;
    const day = days.get(p.legajo + '|' + input.date) || {};
    let state;
    if (day.salida) state = 'finalizó';
    else if (day.entrada) state = 'trabajando';
    else if (day.justificado) state = 'justificado';
    else if (!sched) state = 'sin turno';
    else if (input.nowMinutes > toMinutes(sched.end)) state = 'ausente';
    else state = 'pendiente';
    return { legajo: p.legajo, nombre: p.nombre, apellido: p.apellido, rol: p.rol, sched, entrada: day.entrada || null, state };
  });

  return {
    date: input.date,
    entries,
    kpis: {
      presentes: entries.filter((e) => e.entrada).length,
      trabajando: entries.filter((e) => e.state === 'trabajando').length,
      tardanzas: entries.filter((e) => e.entrada === 'tarde').length,
      pendientes: entries.filter((e) => e.state === 'pendiente').length,
      ausentes: entries.filter((e) => e.state === 'ausente').length,
    },
  };
}

/** Agrupa eventos por profesora y día: primera entrada, salida y justificación. */
function indexEventsByDay(events) {
  const days = new Map();
  for (const e of events) {
    const key = e.legajo + '|' + e.date;
    const day = days.get(key) || {};
    if (e.evento === 'entrada' && !day.entrada) day.entrada = e.estado;
    if (e.evento === 'salida') day.salida = true;
    if (e.evento === 'justificar') day.justificado = true;
    days.set(key, day);
  }
  return days;
}

// ---------------------------------------------------------------------------
// Acceso a la planilla y a la sesión (no se prueba con Node)
// ---------------------------------------------------------------------------

function isOwner_() {
  const owner = (PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '').toLowerCase();
  return owner !== '' && Session.getActiveUser().getEmail().toLowerCase() === owner;
}

function tolerance_() {
  const raw = Number(PropertiesService.getScriptProperties().getProperty('TOLERANCIA_MINUTOS'));
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_TOLERANCE_MINUTES;
}

function readSheet_(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) throw new Error('Falta la hoja "' + name + '" en la planilla');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const keys = headers.map((h) => String(h).trim().toLowerCase());
  return rows
    .filter((r) => r.some((c) => c !== ''))
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]])));
}

/** Las celdas de fecha y hora pueden llegar como Date; las pasamos a texto. */
function dateKey_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v).trim();
}

function timeKey_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'HH:mm') : String(v).trim();
}

function isActive_(v) {
  return ['si', 'sí', 'true', '1'].includes(String(v).trim().toLowerCase());
}

function staffList_() {
  return readSheet_(SHEET.STAFF)
    .filter((p) => isActive_(p.activo))
    .map((p) => ({
      legajo: String(p.legajo).trim(),
      nombre: String(p.nombre).trim(),
      apellido: String(p.apellido).trim(),
      rol: String(p.rol).trim(),
      email: String(p.email).trim().toLowerCase(),
      desde: p.desde ? dateKey_(p.desde) : '',
    }));
}

function schedulesList_() {
  return readSheet_(SHEET.SCHEDULES).map((s) => ({
    legajo: String(s.legajo).trim(),
    weekday: Number(s.dia),
    start: timeKey_(s.inicio),
    end: timeKey_(s.fin),
  }));
}

function eventsList_() {
  return readSheet_(SHEET.EVENTS).map((e) => ({
    date: dateKey_(e.fecha),
    hora: timeKey_(e.hora),
    legajo: String(e.legajo).trim(),
    evento: String(e.evento).trim().toLowerCase(),
    estado: String(e.estado).trim().toLowerCase(),
  }));
}

function context_() {
  const now = new Date();
  const date = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  const hhmm = Utilities.formatDate(now, TZ, 'HH:mm');
  return { date, hhmm, weekday: weekdayOf(date), minutes: toMinutes(hhmm) };
}

/** Profesora activa que está conectada con su cuenta de Google. */
function currentStaff_() {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  const staff = staffList_().find((p) => p.email === email);
  if (!staff) {
    throw new Error('Tu cuenta (' + email + ') no está registrada. Pedí el alta a coordinación.');
  }
  return staff;
}

function eventsToday_(legajo, date) {
  return eventsList_().filter((e) => e.legajo === legajo && e.date === date);
}

function appendEvent_(ctx, staff, evento, estado) {
  SpreadsheetApp.getActive()
    .getSheetByName(SHEET.EVENTS)
    .appendRow([ctx.date, ctx.hhmm, staff.legajo, staff.email, evento, estado]);
}

/** Evita dos fichajes simultáneos de la misma persona. */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function scheduleToday_(legajo, weekday) {
  return schedulesList_().find((s) => s.legajo === legajo && s.weekday === weekday) || null;
}

// ---------------------------------------------------------------------------
// Funciones que llama la página (google.script.run)
// ---------------------------------------------------------------------------

function getMyStatus() {
  const staff = currentStaff_();
  const ctx = context_();
  const events = eventsToday_(staff.legajo, ctx.date);
  const sched = scheduleToday_(staff.legajo, ctx.weekday);
  const entrada = events.find((e) => e.evento === 'entrada');
  const salida = events.find((e) => e.evento === 'salida');
  const justificado = events.some((e) => e.evento === 'justificar');
  return {
    nombre: staff.nombre + ' ' + staff.apellido,
    legajo: staff.legajo,
    turno: sched ? sched.start + ' a ' + sched.end : null,
    entrada: entrada ? entrada.hora : null,
    estadoEntrada: entrada ? entrada.estado : null,
    salida: salida ? salida.hora : null,
    justificado,
  };
}

/**
 * Aplica una acción de fichaje ('entrada' | 'salida' | 'justificar') para una profesora.
 * La usan el formulario de Google y la web app. Llamar siempre dentro de withLock_().
 */
function applyAction_(staff, accion) {
  const ctx = context_();
  const events = eventsToday_(staff.legajo, ctx.date);
  const tiene = (evento) => events.some((e) => e.evento === evento);

  if (accion === 'entrada') {
    if (tiene('entrada')) return { ok: false, message: 'Ya registraste la entrada hoy.' };
    const sched = scheduleToday_(staff.legajo, ctx.weekday);
    const estado = sched ? checkInStatus(ctx.minutes, toMinutes(sched.start), tolerance_()) : 'presente';
    appendEvent_(ctx, staff, 'entrada', estado);
    const msg = estado === 'tarde' ? 'Entrada registrada, llegaste tarde.' : 'Entrada registrada. ¡Buen turno!';
    return { ok: true, message: msg, hora: ctx.hhmm };
  }

  if (accion === 'salida') {
    if (!tiene('entrada')) return { ok: false, message: 'Todavía no registraste tu entrada hoy.' };
    if (tiene('salida')) return { ok: false, message: 'Ya registraste la salida hoy.' };
    appendEvent_(ctx, staff, 'salida', '');
    return { ok: true, message: 'Salida registrada a las ' + ctx.hhmm + '.', hora: ctx.hhmm };
  }

  if (accion === 'justificar') {
    if (tiene('entrada')) return { ok: false, message: 'Ya fichaste la entrada hoy, no hace falta justificar.' };
    if (tiene('justificar')) return { ok: false, message: 'La falta de hoy ya está justificada.' };
    appendEvent_(ctx, staff, 'justificar', 'justificado');
    return { ok: true, message: 'Falta justificada registrada para hoy.' };
  }

  throw new Error('Acción desconocida: ' + accion);
}

function registerCheckIn() {
  return withLock_(() => applyAction_(currentStaff_(), 'entrada'));
}

function registerCheckOut() {
  return withLock_(() => applyAction_(currentStaff_(), 'salida'));
}

function registerJustification() {
  return withLock_(() => applyAction_(currentStaff_(), 'justificar'));
}

// Opciones del formulario de fichaje (la pregunta debe llamarse "Acción")
const FORM_ACTIONS = {
  'Entrada': 'entrada',
  'Salida': 'salida',
  'No vengo (falta justificada)': 'justificar',
};

/**
 * Disparador de Google Forms (planilla vinculada): procesa cada fichaje.
 * Identifica a la profesora por el correo de su cuenta de Google que respondió el formulario.
 */
function onFormSubmit(e) {
  const email = String((e.namedValues['Dirección de correo electrónico'] || [''])[0]).trim().toLowerCase();
  const respuesta = String((e.namedValues['Acción'] || [''])[0]).trim();
  const accion = FORM_ACTIONS[respuesta];

  withLock_(() => {
    const staff = staffList_().find((p) => p.email === email);
    if (!staff) {
      console.error('Fichaje de cuenta no registrada: ' + email);
      return;
    }
    if (!accion) {
      console.error('Acción no reconocida en el formulario: ' + respuesta);
      return;
    }
    const result = applyAction_(staff, accion);
    console.log(staff.legajo + ' ' + accion + ': ' + result.message);
  });
}

/** Solo para la cuenta dueña: métricas del período y tablero de hoy. */
function getDashboard(days) {
  if (!isOwner_()) throw new Error('No autorizado');
  const ctx = context_();
  const from = addDays(ctx.date, -(Math.max(1, Number(days) || 30) - 1));
  const staff = staffList_();
  const schedules = schedulesList_();
  const events = eventsList_();

  const metrics = computeMetrics({
    from, to: ctx.date, today: ctx.date, nowMinutes: ctx.minutes,
    staff, schedules, events,
  });
  const board = computeBoard({
    date: ctx.date, nowMinutes: ctx.minutes, staff, schedules,
    events: events.filter((e) => e.date === ctx.date),
  });
  return { generadoEn: ctx.date + ' ' + ctx.hhmm, metrics, board };
}

// ---------------------------------------------------------------------------
// Entrada de la web app
// ---------------------------------------------------------------------------

function doGet(e) {
  const dashboard = e && e.parameter && e.parameter.vista === 'dashboard';
  if (dashboard && !isOwner_()) {
    return HtmlService.createHtmlOutput('No autorizado.');
  }
  return HtmlService.createTemplateFromFile(dashboard ? 'Dashboard' : 'Fichaje')
    .evaluate()
    .setTitle('Club Juntos – Asistencia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
