import fs from "fs";

const seed = JSON.parse(fs.readFileSync("data/seed.json", "utf8"));

function esc(s) {
  return String(s ?? "").replace(/'/g, "''");
}

function j(v) {
  return `'${esc(JSON.stringify(v))}'::jsonb`;
}

const sql = [];
sql.push("delete from public.jobs;");
sql.push(
  `insert into public.site_settings (key, value) values ('company', '${esc(
    JSON.stringify(seed.company)
  )}'::jsonb), ('document_types', '${esc(
    JSON.stringify(seed.documentTypes)
  )}'::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now();`
);

for (const job of seed.jobs) {
  sql.push(
    `insert into public.jobs (
      id, title, category, location, branch, employment_type, status, salary_range,
      description, qualifications, requirements, urgent, created_at, updated_at
    ) values (
      '${esc(job.id)}',
      '${esc(job.title)}',
      '${esc(job.category)}',
      '${esc(job.location)}',
      '${esc(job.branch || "")}',
      '${esc(job.employment_type)}',
      '${esc(job.status)}',
      '${esc(job.salary_range || "")}',
      '${esc(job.description)}',
      ${j(job.qualifications)},
      ${j(job.requirements)},
      ${job.urgent ? "true" : "false"},
      '${job.created_at}',
      '${job.created_at}'
    ) on conflict (id) do update set
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
      updated_at = now();`
  );
}

fs.writeFileSync("supabase/seed-jobs.sql", sql.join("\n"));
console.log("wrote", sql.length, "statements");
