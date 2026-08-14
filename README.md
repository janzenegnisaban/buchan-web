# Buchan Global Services Corporation — Recruitment Website

Multi-page HTML/CSS/JS recruitment site backed by **Supabase** (Auth, Postgres, Storage).

## Quick start

```bash
npm start
# → http://localhost:5173/index.html
```

**Important:** always use `http://localhost:5173…`.  
Do **not** double-click HTML files (`file://…`) — the browser blocks scripts, so login/register cannot work and forms may put passwords in the URL.

### Auth (Supabase) — required for register/login

1. Open [Supabase Auth Email settings](https://supabase.com/dashboard/project/jmsvobftkciahkldjncf/auth/providers)
2. Under **Email**, turn **Confirm email OFF** while developing  
   (the free Supabase mailer only emails team members and rate-limits quickly)
3. Register at http://localhost:5173/register.html then sign in

Without that, signup may create a user but leave you signed out until email confirmation.

## Supabase project

- URL: `https://jmsvobftkciahkldjncf.supabase.co`
- Client config: [`assets/js/supabase-config.js`](assets/js/supabase-config.js) (anon key only)
- Data API: [`assets/js/api.js`](assets/js/api.js) → [`assets/js/supabase-client.js`](assets/js/supabase-client.js)
- Schema / migrations: [`supabase/migrations/`](supabase/migrations/) and [`supabase/schema.sql`](supabase/schema.sql)
- Hiring seed: [`data/seed.json`](data/seed.json) → applied to `public.jobs` + `site_settings`

**16 Facebook hiring openings** are live in Supabase (Barista, Service Crew, Production Operators, etc.).

### First admin user

1. Register normally on the site (or create a user in Supabase Auth).
2. Promote in SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@company.com';
```

3. Open the hidden admin entry: click **Corporation** in the footer → Admin login.

> In Supabase Dashboard → Authentication → Providers → Email: turn **off** “Confirm email” while testing, or applicants must confirm before sign-in works.

### Re-seed jobs from Facebook data

```bash
node scripts/gen-seed-compact.mjs
# Then run supabase/seed-compact.sql in the SQL Editor (or via MCP execute_sql)
```

## What was built

### Public
Home, About, Services, Contact, Jobs list + detail, Register / Sign in

### Applicants (`/portal`)
Dashboard, profile, document uploads (Storage bucket `applicant-documents`), interview booking

### Admin (`/admin`)
Stats, applicants review, job CRUD, interview slots, appointments

## Application statuses

`submitted` → `under_review` → `qualified` / `not_qualified` → `interview_scheduled` → `interviewed` → `hired` / `talent_pool`

## Contact

- Subic: `buchan_recruitment@yahoo.com` · 047-603-1583
- Clark: `buchanglobal.clark@gmail.com` · (045)-599-3928
- Hiring areas: SBMA / Zambales / Bataan / Clark

## Local mock (legacy)

[`assets/js/mock-db.js`](assets/js/mock-db.js) is no longer used by the live site. Kept for reference only.
