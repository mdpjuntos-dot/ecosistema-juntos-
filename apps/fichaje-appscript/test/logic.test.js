// Pruebas de la lógica pura de Code.gs (sin servicios de Google).
// Ejecutar desde la raíz del repo: node --test apps/fichaje-appscript/test/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
// Solo definiciones: las funciones que tocan la planilla no se ejecutan acá.
const api = vm.runInNewContext(
  source + '\n;({ weekdayOf, toMinutes, checkInStatus, addDays, datesBetween, computeMetrics, computeBoard })',
  {}
);

const staffGomez = { legajo: 'P0001', nombre: 'Manuela', apellido: 'Gómez Trillo', rol: 'Kinesiólogo', desde: '' };
const monday = { legajo: 'P0001', weekday: 1, start: '09:00', end: '12:00' };

test('weekdayOf: lunes es 1 y domingo es 7', () => {
  assert.equal(api.weekdayOf('2026-10-12'), 1);
  assert.equal(api.weekdayOf('2026-10-11'), 7);
  assert.equal(api.weekdayOf('2026-10-05'), 1);
});

test('checkInStatus: dentro de la tolerancia es presente, después es tarde', () => {
  const start = api.toMinutes('09:00');
  assert.equal(api.checkInStatus(api.toMinutes('09:10'), start, 10), 'presente');
  assert.equal(api.checkInStatus(api.toMinutes('09:11'), start, 10), 'tarde');
});

test('addDays y datesBetween cruzan meses', () => {
  assert.equal(api.addDays('2026-10-31', 1), '2026-11-01');
  // Array.from: el arreglo viene de otro contexto de vm y deepEqual compara prototipos
  assert.deepEqual(Array.from(api.datesBetween('2026-10-30', '2026-11-01')), ['2026-10-30', '2026-10-31', '2026-11-01']);
});

test('computeMetrics: día sin fichaje cuenta como ausencia, pero no antes del alta', () => {
  const result = api.computeMetrics({
    from: '2026-10-05', to: '2026-10-12', today: '2026-10-12', nowMinutes: 13 * 60,
    staff: [staffGomez], schedules: [monday], events: [],
  });
  // Lunes 5 y lunes 12 (ya pasó el turno): dos ausencias
  assert.equal(result.rows[0].ausencias, 2);

  const withAlta = api.computeMetrics({
    from: '2026-10-05', to: '2026-10-12', today: '2026-10-12', nowMinutes: 13 * 60,
    staff: [{ ...staffGomez, desde: '2026-10-12' }], schedules: [monday], events: [],
  });
  assert.equal(withAlta.rows[0].ausencias, 1);
});

test('computeMetrics: turno de hoy en curso no cuenta como ausencia', () => {
  const result = api.computeMetrics({
    from: '2026-10-12', to: '2026-10-12', today: '2026-10-12', nowMinutes: 11 * 60,
    staff: [staffGomez], schedules: [monday], events: [],
  });
  assert.equal(result.rows[0].expected, 0);
  assert.equal(result.rows[0].ausencias, 0);
});

test('computeMetrics: tardanza, justificación y puntualidad', () => {
  const events = [
    { date: '2026-10-05', legajo: 'P0001', evento: 'entrada', estado: 'presente' },
    { date: '2026-10-12', legajo: 'P0001', evento: 'entrada', estado: 'tarde' },
  ];
  const justified = [{ date: '2026-10-06', legajo: 'P0001', evento: 'justificar', estado: 'justificado' }];
  const weekly = [
    { legajo: 'P0001', weekday: 1, start: '09:00', end: '12:00' },
    { legajo: 'P0001', weekday: 2, start: '14:00', end: '18:00' },
  ];
  const result = api.computeMetrics({
    from: '2026-10-05', to: '2026-10-12', today: '2026-10-12', nowMinutes: 13 * 60,
    staff: [staffGomez], schedules: weekly, events: [...events, ...justified],
  });
  const row = result.rows[0];
  assert.equal(row.presentes, 2);
  assert.equal(row.tardanzas, 1);
  assert.equal(row.justificadas, 1);
  assert.equal(row.ausencias, 0);
  // Turnos: lun 5 (a horario), mar 6 (justificado, cuenta como turno), lun 12 (tarde)
  assert.equal(row.expected, 3);
  assert.equal(row.puntualidad, 33); // 1 a horario de 3 turnos
});

test('computeBoard: estados de hoy y KPIs', () => {
  const staff = [
    staffGomez,
    { legajo: 'P0002', nombre: 'Evelina', apellido: 'Lambrecht', rol: 'AT', desde: '' },
    { legajo: 'P0003', nombre: 'Juliana', apellido: 'Sagasti', rol: 'Prof. EF', desde: '' },
  ];
  const schedules = [
    monday,
    { legajo: 'P0002', weekday: 1, start: '08:00', end: '10:00' },
  ];
  const events = [
    { date: '2026-10-12', legajo: 'P0001', evento: 'entrada', estado: 'tarde' },
    { date: '2026-10-12', legajo: 'P0002', evento: 'justificar', estado: 'justificado' },
  ];
  const board = api.computeBoard({ date: '2026-10-12', nowMinutes: 13 * 60, staff, schedules, events });
  const state = Object.fromEntries(board.entries.map((e) => [e.legajo, e.state]));
  assert.equal(state.P0001, 'trabajando');
  assert.equal(state.P0002, 'justificado');
  assert.equal(state.P0003, 'sin turno');
  assert.equal(board.kpis.presentes, 1);
  assert.equal(board.kpis.tardanzas, 1);
  assert.equal(board.kpis.trabajando, 1);
});
