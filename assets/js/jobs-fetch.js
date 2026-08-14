/** Public job reads via Supabase REST (anon key). Falls back to data/seed.json. */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Accept: "application/json",
};

function ok(data) {
  return { data, error: null };
}

function fail(message) {
  return { data: null, error: { message } };
}

async function fetchWithTimeout(url, options = {}, ms = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchOpenJobs({ search, category, location, employment_type, status = "open" } = {}) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "created_at.desc");
  if (status) params.set("status", `eq.${status}`);
  if (category) params.set("category", `eq.${category}`);
  if (employment_type) params.set("employment_type", `eq.${employment_type}`);
  if (location) params.set("location", `ilike.*${location}*`);
  if (search) {
    const s = search.replace(/[%*,]/g, "");
    params.set("or", `(title.ilike.*${s}*,description.ilike.*${s}*,category.ilike.*${s}*)`);
  }

  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/jobs?${params}`, { headers });
    if (res.ok) {
      const data = await res.json();
      return ok(Array.isArray(data) ? data : []);
    }
  } catch (err) {
    console.warn("Supabase jobs failed, using seed.json", err);
  }

  try {
    const res = await fetchWithTimeout("data/seed.json", { headers: { Accept: "application/json" } });
    if (!res.ok) return fail(`seed.json ${res.status}`);
    const seed = await res.json();
    let jobs = (seed.jobs || []).filter((j) => !status || j.status === status);
    if (category) jobs = jobs.filter((j) => j.category === category);
    if (employment_type) jobs = jobs.filter((j) => j.employment_type === employment_type);
    if (location) {
      const loc = location.toLowerCase();
      jobs = jobs.filter((j) => String(j.location || "").toLowerCase().includes(loc));
    }
    if (search) {
      const s = search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          (j.title || "").toLowerCase().includes(s) ||
          (j.description || "").toLowerCase().includes(s) ||
          (j.category || "").toLowerCase().includes(s)
      );
    }
    return ok(jobs);
  } catch (err) {
    return fail(err.message || String(err));
  }
}

export async function fetchJobById(id) {
  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/jobs?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers }
    );
    if (res.ok) {
      const rows = await res.json();
      if (rows?.length) return ok(rows[0]);
    }
  } catch {
    /* fall through */
  }
  try {
    const res = await fetchWithTimeout("data/seed.json");
    const seed = await res.json();
    const job = (seed.jobs || []).find((j) => j.id === id);
    if (job) return ok(job);
  } catch {
    /* fall through */
  }
  return fail("Job not found");
}

export function jobCardHtml(job) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const urgent = job.urgent ? '<span class="badge badge-urgent">Urgent</span>' : "";
  const covers = {
    "job-barista-subic": "barista.jpg",
    "job-barista-clark": "barista.jpg",
    "job-service-crew-clark": "service.jpg",
    "job-service-crew-subic": "service.jpg",
    "job-production-operators": "production.jpg",
    "job-skilled-sewer": "sewing.jpg",
    "job-hr-coordinator": "hr.jpg",
    "job-qc-support": "docs.jpg",
    "job-materials-control": "warehouse.jpg",
    "job-engineering-support": "engineering.jpg",
    "job-kitchen-staff": "kitchen.jpg",
    "job-line-cook": "kitchen.jpg",
    "job-utility": "safety.jpg",
    "job-driver": "warehouse.jpg",
    "job-janitor": "safety.jpg",
    "job-junior-hairstylist": "interview.jpg",
  };
  const byCat = {
    Production: "production.jpg",
    Garments: "sewing.jpg",
    Warehouse: "warehouse.jpg",
    "Food & Beverage": "barista.jpg",
    "Office / HR": "hr.jpg",
    "Quality Control": "docs.jpg",
    Engineering: "engineering.jpg",
    Facilities: "safety.jpg",
    Logistics: "warehouse.jpg",
    "Personal Care": "interview.jpg",
  };
  const img = covers[job.id] || byCat[job.category] || "docs.jpg";
  const snippet = (job.description || "").slice(0, 100);
  const more = (job.description || "").length > 100 ? "…" : "";
  return `
    <article class="card card-hover job-card">
      <div class="job-cover">
        <img src="assets/img/jobs/${img}" alt="${esc(job.title)}" loading="lazy" />
        <div class="cover-badges">
          ${urgent}
          <span class="chip chip-open">Open</span>
        </div>
      </div>
      <div class="card-body">
        <span class="badge">${esc(job.category || "")}</span>
        <h3 class="card-title">${esc(job.title)}</h3>
        <p class="card-meta">${esc(job.location || "—")} · ${esc(job.employment_type || "")}</p>
        <p class="text-muted mb-0">${esc(snippet)}${more}</p>
      </div>
      <div class="card-actions">
        <a class="btn btn-primary btn-sm" href="job.html?id=${encodeURIComponent(job.id)}">Apply now</a>
      </div>
    </article>`;
}
