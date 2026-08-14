import { api } from "../api.js";
import { requireUser } from "../auth.js";
import { renderAdminSidebar, initAdminShell, escapeHtml } from "../ui.js";

const user = await requireUser({ role: "admin", loginPath: "login.html" });
if (!user) throw new Error("redirect");

renderAdminSidebar("dashboard");
initAdminShell();

const { data: stats, error } = await api.meta.getAdminStats();
const el = document.getElementById("stats");
if (error) {
  el.innerHTML = `<div class="alert alert-error">${escapeHtml(error.message)}</div>`;
} else {
  el.innerHTML = `
    <div class="stat-card"><div class="stat-value">${stats.pending_review}</div><div class="stat-label">Pending review</div></div>
    <div class="stat-card"><div class="stat-value">${stats.new_applications}</div><div class="stat-label">New / in review</div></div>
    <div class="stat-card"><div class="stat-value">${stats.upcoming_interviews}</div><div class="stat-label">Upcoming interviews</div></div>
    <div class="stat-card"><div class="stat-value">${stats.open_jobs}</div><div class="stat-label">Open jobs</div></div>
    <div class="stat-card"><div class="stat-value">${stats.total_applicants}</div><div class="stat-label">Total applications</div></div>
  `;
}