-- Club Juntos: control de asistencia de profesores
-- Ejecutar una vez en el SQL editor de Supabase.

create sequence if not exists staff_legajo_seq start 1;

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  legajo text unique not null
    default ('P' || lpad(nextval('staff_legajo_seq')::text, 4, '0')),
  first_name text not null,
  last_name text not null,
  dni text unique not null,
  role text not null,
  specialty text,
  phone text unique,                      -- solo dígitos, normalizado con phoneKey()
  active boolean not null default true,
  active_from date not null default current_date, -- desde acá se cuentan turnos en las métricas
  created_at timestamptz not null default now()
);

-- Horario fijo: una fila por día de la semana que trabaja (1 = lunes ... 7 = domingo)
create table if not exists staff_schedules (
  staff_id uuid not null references staff(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  primary key (staff_id, weekday),
  check (end_time > start_time)
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null check (status in ('presente', 'tarde', 'justificado', 'ausente')),
  channel text not null default 'whatsapp',
  unique (staff_id, date)
);

-- El servidor usa la service role key (bypassa RLS). Bloqueamos el acceso público.
alter table staff enable row level security;
alter table staff_schedules enable row level security;
alter table attendance enable row level security;
