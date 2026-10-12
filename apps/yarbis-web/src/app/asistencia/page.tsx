import { getTodayBoard, BoardState } from '@/lib/staff-attendance';

// Tablero de asistencia del día. Se renderiza en el servidor, sin exponer credenciales.
// Antes de publicarlo hay que protegerlo con login (Supabase Auth).
export const dynamic = 'force-dynamic';

const STATE_STYLE: Record<BoardState, string> = {
  trabajando: 'bg-emerald-100 text-emerald-800',
  finalizó: 'bg-slate-100 text-slate-700',
  pendiente: 'bg-amber-100 text-amber-800',
  ausente: 'bg-red-100 text-red-800',
  justificado: 'bg-blue-100 text-blue-800',
  'sin turno': 'bg-slate-50 text-slate-400',
};

function hhmm(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export default async function AsistenciaPage() {
  const board = await getTodayBoard();
  const { kpis } = board;

  const cards = [
    { label: 'Presentes', value: kpis.presentes },
    { label: 'Trabajando ahora', value: kpis.trabajando },
    { label: 'Tardanzas', value: kpis.tardanzas },
    { label: 'Pendientes', value: kpis.pendientes },
    { label: 'Ausentes', value: kpis.ausentes },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Asistencia de profesores</h1>
      <p className="text-sm text-slate-500">Hoy: {board.date}</p>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Legajo</th>
              <th className="p-3">Profesor</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Turno</th>
              <th className="p-3">Entrada</th>
              <th className="p-3">Salida</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {board.entries.map((e) => (
              <tr key={e.staff.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{e.staff.legajo}</td>
                <td className="p-3">
                  {e.staff.firstName} {e.staff.lastName}
                </td>
                <td className="p-3 text-slate-600">{e.staff.role}</td>
                <td className="p-3 text-slate-600">
                  {e.schedule
                    ? `${e.schedule.startTime.slice(0, 5)} – ${e.schedule.endTime.slice(0, 5)}`
                    : '—'}
                </td>
                <td className="p-3">{hhmm(e.attendance?.checkIn ?? null)}</td>
                <td className="p-3">{hhmm(e.attendance?.checkOut ?? null)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${STATE_STYLE[e.state]}`}>
                    {e.state}
                    {e.attendance?.status === 'tarde' && e.state !== 'sin turno' ? ' · tarde' : ''}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
