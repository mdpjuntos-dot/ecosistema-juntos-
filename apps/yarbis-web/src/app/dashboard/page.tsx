import { getMetrics, getTodayBoard, localNow } from '@/lib/staff-attendance';

// Dashboard de asistencia del personal. Se renderiza en el servidor y lo protege middleware.ts.
export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90];

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pct(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias } = await searchParams;
  const parsed = Number(dias);
  const days = RANGES.includes(parsed) ? parsed : 30;

  const today = localNow().date;
  const from = shiftDate(today, -(days - 1));
  const [board, report] = await Promise.all([getTodayBoard(), getMetrics(from, today)]);
  const { totals } = report;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard de asistencia</h1>
          <p className="text-sm text-slate-500">
            Período: {from} a {today} ({days} días)
          </p>
        </div>
        <nav className="flex gap-2 text-sm">
          {RANGES.map((r) => (
            <a
              key={r}
              href={`?dias=${r}`}
              className={`rounded-full px-3 py-1 ${
                r === days ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 shadow-sm'
              }`}
            >
              {r} días
            </a>
          ))}
        </nav>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-500">Hoy</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Card label="Presentes" value={board.kpis.presentes} />
          <Card label="Trabajando ahora" value={board.kpis.trabajando} />
          <Card label="Tardanzas" value={board.kpis.tardanzas} />
          <Card label="Pendientes" value={board.kpis.pendientes} />
          <Card label="Ausentes" value={board.kpis.ausentes} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-500">Período</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Card label="Asistencia" value={pct(totals.asistencia)} hint={`${totals.presentes} de ${totals.expected} turnos`} />
          <Card label="Tardanzas" value={totals.tardanzas} />
          <Card label="Ausencias" value={totals.ausencias} />
          <Card label="Justificadas" value={totals.justificadas} />
          <Card label="Turnos programados" value={totals.expected} />
        </div>
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Legajo</th>
              <th className="p-3">Profesor</th>
              <th className="p-3">Rol</th>
              <th className="p-3 text-right">Turnos</th>
              <th className="p-3 text-right">Presentes</th>
              <th className="p-3 text-right">Tardanzas</th>
              <th className="p-3 text-right">Ausencias</th>
              <th className="p-3 text-right">Justif.</th>
              <th className="p-3">A horario</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.staff.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{r.staff.legajo}</td>
                <td className="p-3">
                  {r.staff.firstName} {r.staff.lastName}
                </td>
                <td className="p-3 text-slate-600">{r.staff.role}</td>
                <td className="p-3 text-right">{r.expected}</td>
                <td className="p-3 text-right">{r.presentes}</td>
                <td className="p-3 text-right">{r.tardanzas}</td>
                <td className="p-3 text-right font-medium text-red-700">{r.ausencias}</td>
                <td className="p-3 text-right">{r.justificadas}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded bg-slate-100">
                      <div
                        className="h-2 bg-emerald-500"
                        style={{ width: `${r.puntualidad ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">{pct(r.puntualidad)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
