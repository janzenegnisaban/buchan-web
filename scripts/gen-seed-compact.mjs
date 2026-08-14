import fs from "fs";

const seed = JSON.parse(fs.readFileSync("data/seed.json", "utf8"));

const jobs = seed.jobs.map((j) => ({
  id: j.id,
  title: j.title,
  category: j.category,
  location: j.location,
  branch: j.branch || "",
  employment_type: j.employment_type,
  status: j.status,
  salary_range: j.salary_range || "",
  description: j.description,
  qualifications: j.qualifications,
  requirements: j.requirements,
  urgent: !!j.urgent,
  created_at: j.created_at,
}));

const company = JSON.stringify(seed.company).replace(/'/g, "''");
const docs = JSON.stringify(seed.documentTypes).replace(/'/g, "''");
const jobsJson = JSON.stringify(jobs).replace(/'/g, "''");

const sql = `
delete from public.jobs;

insert into public.site_settings (key, value) values
  ('company', '${company}'::jsonb),
  ('document_types', '${docs}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.jobs (
  id, title, category, location, branch, employment_type, status, salary_range,
  description, qualifications, requirements, urgent, created_at, updated_at
)
select
  x.id, x.title, x.category, x.location, x.branch, x.employment_type, x.status, x.salary_range,
  x.description, x.qualifications, x.requirements, x.urgent, x.created_at::timestamptz, x.created_at::timestamptz
from jsonb_to_recordset('${jobsJson}'::jsonb) as x(
  id text,
  title text,
  category text,
  location text,
  branch text,
  employment_type text,
  status text,
  salary_range text,
  description text,
  qualifications jsonb,
  requirements jsonb,
  urgent boolean,
  created_at text
)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  location = excluded.location,
  branch = excluded.branch,
  employment_type = excluded.employment_type,
  status = excluded.status,
  description = excluded.description,
  qualifications = excluded.qualifications,
  requirements = excluded.requirements,
  urgent = excluded.urgent,
  updated_at = now();
`;

fs.writeFileSync("supabase/seed-compact.sql", sql.trim() + "\n");
console.log("bytes", Buffer.byteLength(sql));
