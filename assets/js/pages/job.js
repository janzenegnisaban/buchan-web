import { fetchJobById } from "../jobs-fetch.js";
import { currentUser } from "../auth.js";
import { renderHeader, renderFooter, emptyState, escapeHtml, formatDate, getParam } from "../ui.js";
import { jobCover } from "../interact.js";

renderHeader("jobs").catch(() => {});
renderFooter();

const root = document.getElementById("job-detail");
const id = getParam("id");

if (!id) {
  root.innerHTML = emptyState("Job not found", "Missing job id.", `<a class="btn btn-primary" href="jobs.html">Back to jobs</a>`);
} else {
  const { data: job, error } = await fetchJobById(id);
  if (error || !job) {
    root.innerHTML = emptyState("Job not found", error?.message || "This opening may have been removed.", `<a class="btn btn-primary" href="jobs.html">Back to jobs</a>`);
  } else {
    let user = null;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }
    const applyHref = user
      ? `apply.html?job=${encodeURIComponent(job.id)}`
      : `login.html?next=${encodeURIComponent(`apply.html?job=${job.id}`)}`;

    const quals = (job.qualifications || []).map((q) => `<li>${escapeHtml(q)}</li>`).join("") || "<li>See description</li>";
    const reqs = (job.requirements || []).map((q) => `<li>${escapeHtml(q)}</li>`).join("") || "<li>Updated resume and valid IDs</li>";

    root.innerHTML = `
      <p class="mb-4"><a href="jobs.html">&larr; All jobs</a></p>
      <div class="content-grid content-grid-sidebar">
        <div class="card reveal is-in">
          <img class="job-hero-photo" src="${jobCover(job)}" alt="${escapeHtml(job.title)}" />
          <div class="card-meta">
            ${job.urgent ? '<span class="badge badge-urgent">Urgent hiring</span> ' : ""}
            <span class="chip chip-${job.status === "open" ? "open" : "closed"}">${escapeHtml(job.status)}</span>
            <span class="badge">${escapeHtml(job.category || "")}</span>
          </div>
          <h1 style="font-size:var(--font-size-3xl);margin-bottom:var(--space-2);">${escapeHtml(job.title)}</h1>
          <p class="text-muted">${escapeHtml(job.location || "—")} · ${escapeHtml(job.employment_type || "")} · Posted ${formatDate(job.created_at)}</p>
          ${job.salary_range ? `<p><strong>Compensation:</strong> ${escapeHtml(job.salary_range)}</p>` : ""}
          <h3>About the role</h3>
          <p>${escapeHtml(job.description || "")}</p>
          <h3>Qualifications</h3>
          <ul>${quals}</ul>
          <h3>Requirements</h3>
          <ul>${reqs}</ul>
        </div>
        <aside class="card reveal is-in">
          <h3 class="mt-0">Ready to apply?</h3>
          <p class="text-muted">Create an account, submit your application, then upload your documents.</p>
          <a class="btn btn-primary btn-block" href="${applyHref}">Apply now</a>
          <a class="btn btn-outline btn-block mt-2" href="jobs.html">Browse more jobs</a>
        </aside>
      </div>
    `;
  }
}
