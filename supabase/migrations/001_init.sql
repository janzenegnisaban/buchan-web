-- Buchan Global Services Corporation — initial schema
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text default '',
  address text default '',
  education text default '',
  experience text default '',
  skills text default '',
  role text not null default 'applicant' check (role in ('applicant', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stable text ids match Facebook hiring seed (job-barista-subic, etc.)
create table if not exists public.jobs (
  id text primary key,
  title text not null,
  category text default 'General',
  location text default '',
  branch text default '',
  employment_type text default 'Contractual',
  status text not null default 'open' check (status in ('open', 'closed')),
  salary_range text default '',
  description text default '',
  qualifications jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  urgent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted' check (status in (
    'submitted', 'under_review', 'qualified', 'not_qualified',
    'interview_scheduled', 'interviewed', 'hired', 'talent_pool'
  )),
  cover_letter text default '',
  status_reason text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  mime_type text,
  storage_path text not null,
  size bigint default 0,
  status text not null default 'uploaded' check (status in ('uploaded', 'verified', 'rejected')),
  review_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 1 check (capacity > 0),
  booked_count int not null default 0 check (booked_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid not null references public.interview_slots(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed', 'no_show')),
  outcome text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Auto profile on signup (role always applicant — never trust user_metadata for authz)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'applicant'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- RLS
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.interview_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.application_notes enable row level security;
alter table public.site_settings enable row level security;

-- Profiles
create policy "Profiles: read own or admin"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin());

create policy "Profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "Profiles: admin update"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Jobs
create policy "Jobs: anyone read"
  on public.jobs for select to anon, authenticated
  using (true);

create policy "Jobs: admin insert"
  on public.jobs for insert to authenticated
  with check (public.is_admin());

create policy "Jobs: admin update"
  on public.jobs for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Jobs: admin delete"
  on public.jobs for delete to authenticated
  using (public.is_admin());

-- Applications
create policy "Applications: applicant read own"
  on public.applications for select to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin());

create policy "Applications: applicant insert own"
  on public.applications for insert to authenticated
  with check (applicant_id = (select auth.uid()));

create policy "Applications: applicant update own"
  on public.applications for update to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin())
  with check (applicant_id = (select auth.uid()) or public.is_admin());

-- Documents
create policy "Documents: owner or admin read"
  on public.documents for select to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin());

create policy "Documents: owner insert"
  on public.documents for insert to authenticated
  with check (applicant_id = (select auth.uid()));

create policy "Documents: owner delete"
  on public.documents for delete to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin());

create policy "Documents: owner or admin update"
  on public.documents for update to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin())
  with check (applicant_id = (select auth.uid()) or public.is_admin());

-- Slots
create policy "Slots: anyone read"
  on public.interview_slots for select to anon, authenticated
  using (true);

create policy "Slots: admin write"
  on public.interview_slots for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Appointments
create policy "Appointments: owner or admin read"
  on public.appointments for select to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin());

create policy "Appointments: owner or admin insert"
  on public.appointments for insert to authenticated
  with check (applicant_id = (select auth.uid()) or public.is_admin());

create policy "Appointments: owner or admin update"
  on public.appointments for update to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin())
  with check (applicant_id = (select auth.uid()) or public.is_admin());

-- Notes
create policy "Notes: related parties read"
  on public.application_notes for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.applications a
      where a.id = application_id and a.applicant_id = (select auth.uid())
    )
  );

create policy "Notes: authenticated insert"
  on public.application_notes for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.applications a
      where a.id = application_id and a.applicant_id = (select auth.uid())
    )
  );

-- Site settings (public read for company/doc types)
create policy "Settings: anyone read"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "Settings: admin write"
  on public.site_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Grants for Data API
grant usage on schema public to anon, authenticated;
grant select on public.jobs, public.interview_slots, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, insert on public.application_notes to authenticated;
grant select, insert, update, delete on public.interview_slots to authenticated;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;

-- Storage
insert into storage.buckets (id, name, public)
values ('applicant-documents', 'applicant-documents', false)
on conflict (id) do nothing;

create policy "Storage: applicant upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'applicant-documents'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Storage: applicant read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

create policy "Storage: applicant update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'applicant-documents'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

create policy "Storage: applicant delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
