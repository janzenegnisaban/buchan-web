import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderHeader,
  renderFooter,
  renderPortalSidebar,
  escapeHtml,
  statusChip,
  formatDateTime,
  emptyState,
} from "../ui.js";

const user = await requireUser({ role: "applicant", loginPath: "../login.html" });
if (!user) throw new Error("redirect");

await renderHeader();
renderFooter();
renderPortalSidebar("dashboard");

document.getElementById("welcome").textContent = `Welcome, ${user.full_name || user.email}`;

const root = document.getElementById("dash-root");
const { data: apps, error } = await api.applications.listMine();

if (error) {
  root.innerHTML = emptyState("Error", error.message);
} else if (!apps.length) {
  root.innerHTML = emptyState(
    "No applications yet",
    "Browse open jobs and submit your first application.",
    `<a class="btn btn-primary" href="../jobs.html">Browse jobs</a>`
  );
} else {
  root.innerHTML = apps
    .map((app) => {
      let next = "";
      if (app.status === "submitted" || app.status === "under_review") {
        next = `<a class="btn btn-secondary btn-sm" href="documents.html?app=${app.id}">Upload / complete documents</a>`;
      } else if (app.status === "qualified") {
        next = `<a class="btn btn-primary btn-sm" href="appointment.html?app=${app.id}">Book interview slot</a>`;
      } else if (app.status === "interview_scheduled") {
        next = `<a class="btn btn-outline btn-sm" href="appointment.html?app=${app.id}">View appointment</a>`;
      } else if (app.status === "not_qualified") {
        next = `<span class="text-muted">This application was not qualified${app.status_reason ? `: ${escapeHtml(app.status_reason)}` : ""}.</span>`;
      }

      const timeline = (app.notes || [])
        .slice()
        .reverse()
        .slice(0, 5)
        .map(
          (n) => `
        <li class="timeline-item">
          <div class="time">${formatDateTime(n.created_at)}</div>
          <div>${escapeHtml(n.body)}</div>
        </li>`
        )
        .join("");

      return `
      <article class="card mb-4">
        <div class="portal-header" style="margin-bottom:var(--space-4);">
          <div>
            <h3 class="mt-0 mb-2">${escapeHtml(app.job?.title || "Job")}</h3>
            <p class="text-muted mb-0">${escapeHtml(app.job?.location || "")} · Applied ${formatDateTime(app.created_at)}</p>
          </div>
          ${statusChip(app.status)}
        </div>
        ${next ? `<div class="mb-4">${next}</div>` : ""}
        <h4 style="font-size:var(--font-size-sm);text-transform:uppercase;letter-spacing:.04em;color:var(--color-muted);">Timeline</h4>
        <ul class="timeline">${timeline || "<li class='timeline-item'>No updates yet</li>"}</ul>
        <div class="hero-actions mt-4">
          <a class="btn btn-outline btn-sm" href="documents.html?app=${app.id}">Documents</a>
          <a class="btn btn-ghost btn-sm" href="../job.html?id=${encodeURIComponent(app.job_id)}">Job details</a>
        </div>
      </article>`;
    })
    .join("");
}