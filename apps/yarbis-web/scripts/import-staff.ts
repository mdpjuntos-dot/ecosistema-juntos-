/**
 * Carga masiva de profesores desde un CSV (separado por punto y coma).
 *
 * Uso (desde apps/yarbis-web, con las variables de .env.local):
 *   npm run import:staff -- ruta/al/archivo.csv
 *
 * Columnas (la primera fila es el encabezado):
 *   nombre;apellido;dni;rol;especialidad;telefono;horarios;desde
 *   (desde es opcional: YYYY-MM-DD desde cuándo se cuentan turnos en las métricas; por defecto, hoy)
 *
 * horarios: "Lu 09:00-12:00, Ma 14:00-18:00" (Lu, Ma, Mi, Ju, Vi, Sa, Do)
 * El legajo lo asigna el sistema. Las filas con error se saltean y se informan.
 */
import { readFileSync } from 'fs';
import { createStaff } from '../src/lib/staff-attendance';

const DAYS: Record<string, number> = { lu: 1, ma: 2, mi: 3, ju: 4, vi: 5, sa: 6, do: 7 };

export function parseSchedules(raw: string): { weekday: number; startTime: string; endTime: string }[] {
  if (!raw.trim()) return [];
  return raw.split(',').map((token) => {
    const match = token.trim().match(/^(Lu|Ma|Mi|Ju|Vi|Sa|Do)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/i);
    if (!match) throw new Error(`Horario no reconocido: "${token.trim()}"`);
    const [, day, start, end] = match;
    if (end <= start) throw new Error(`Horario inválido (fin antes de inicio): "${token.trim()}"`);
    return { weekday: DAYS[day.toLowerCase()], startTime: start, endTime: end };
  });
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Falta la ruta del CSV. Ejemplo: npm run import:staff -- staff.csv');
    process.exit(1);
  }

  const [headerLine, ...lines] = readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const headers = headerLine.split(';').map((h) => h.trim().toLowerCase());
  const col = (cells: string[], name: string) => (cells[headers.indexOf(name)] ?? '').trim();

  let created = 0;
  const failed: string[] = [];

  for (const [index, line] of lines.entries()) {
    const cells = line.split(';');
    const label = `fila ${index + 2} (${col(cells, 'apellido')}, ${col(cells, 'nombre')})`;
    try {
      const dni = col(cells, 'dni');
      if (!dni) throw new Error('falta DNI');
      const staff = await createStaff({
        firstName: col(cells, 'nombre'),
        lastName: col(cells, 'apellido'),
        dni,
        role: col(cells, 'rol'),
        specialty: col(cells, 'especialidad') || undefined,
        phone: col(cells, 'telefono') || undefined,
        activeFrom: col(cells, 'desde') || undefined,
        schedules: parseSchedules(col(cells, 'horarios')),
      });
      created++;
      console.log(`✔ ${staff.legajo} ${staff.firstName} ${staff.lastName}`);
    } catch (error) {
      failed.push(`${label}: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\nCreados: ${created}. Con error: ${failed.length}.`);
  for (const f of failed) console.log(`✘ ${f}`);
}

// Solo corre al ejecutar el archivo directamente, no al importar parseSchedules en pruebas
if (process.argv[1]?.endsWith('import-staff.ts')) {
  main();
}
