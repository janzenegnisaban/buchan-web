import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderAdminSidebar,
  initAdminShell,
  escapeHtml,
  statusChip,
  formatDateTime,
  emptyState,
  showLoading,
} from "../ui.js";

const user = await requireUser({ role: "admin", loginPath: "login.html" });
if (!user) throw new Error("redirect");

renderAdminSidebar("applicants");
initAdminShell();

const root = document.getElementById("table-root");
const jobSel = document.getElementById("job_id");

const { data: jobs } = await api.jobs.list();
(jobs || []).forEach((j) => {
  const opt = document.createElement("option");
  opt.value = j.id;
  opt.textContent = j.title;
  jobSel.appendChild(opt);
});

async function load() {
  showLoading(root);
  const { data, error } = await api.applications.listAll({
    search: document.getElementById("q").value.trim(),
    status: document.getElementById("status").value,
    job_id: document.getElementById("job_id").value,
  });
  if (error) {
    root.innerHTML = emptyState("Error", error.message);
    return;
  }
  if (!data.length) {
    root.innerHTML = emptyState("No applicants", "No applications match these filters.");
    return;
  }
  root.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Job</th>
            <th>Status</th>
            <th>Submitted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (a) => `
            <tr>
              <td>
                <strong>${escapeHtml(a.applicant?.full_name || "—")}</strong><br />
                <span class="text-muted">${escapeHtml(a.applicant?.email || "")}</span>
              </td>
              <td>${escapeHtml(a.job?.title || "—")}</td>
              <td>${statusChip(a.status)}</td>
              <td>${formatDateTime(a.created_at)}</td>
              <td><a class="btn btn-primary btn-sm" href="applicant.html?id=${a.id}">Review</a></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

document.getElementById("btn-filter").addEventListener("click", load);
document.getElementById("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") load();
});
await load();