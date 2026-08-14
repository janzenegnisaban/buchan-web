import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderAdminSidebar,
  initAdminShell,
  escapeHtml,
  formatDate,
  emptyState,
  showLoading,
  toast,
} from "../ui.js";
import { parseList, validateForm, required } from "../validate.js";

const user = await requireUser({ role: "admin", loginPath: "login.html" });
if (!user) throw new Error("redirect");

renderAdminSidebar("jobs");
initAdminShell();

const root = document.getElementById("jobs-root");
const modal = document.getElementById("job-modal");
const form = document.getElementById("job-form");

function openModal(job = null) {
  document.getElementById("modal-title").textContent = job ? "Edit job" : "New job";
  form.reset();
  form.job_id.value = job?.id || "";
  if (job) {
    form.title.value = job.title || "";
    form.category.value = job.category || "";
    form.employment_type.value = job.employment_type || "Contractual";
    form.location.value = job.location || "";
    form.salary_range.value = job.salary_range || "";
    form.description.value = job.description || "";
    form.qualifications.value = (job.qualifications || []).join("\n");
    form.requirements.value = (job.requirements || []).join("\n");
    form.status.value = job.status || "open";
    form.urgent.checked = !!job.urgent;
  }
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

document.getElementById("btn-new-job").addEventListener("click", () => openModal());
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-cancel").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { ok, values } = validateForm(form, {
    title: (v) => required(v, "Title"),
  });
  // collect unchecked fields too
  const payload = {
    title: form.title.value.trim(),
    category: form.category.value.trim(),
    employment_type: form.employment_type.value.trim(),
    location: form.location.value.trim(),
    salary_range: form.salary_range.value.trim(),
    description: form.description.value.trim(),
    qualifications: parseList(form.qualifications.value),
    requirements: parseList(form.requirements.value),
    status: form.status.value,
    urgent: form.urgent.checked,
  };
  if (!ok) return;

  const id = form.job_id.value;
  const res = id ? await api.jobs.update(id, payload) : await api.jobs.create(payload);
  if (res.error) toast(res.error.message, "error");
  else {
    toast("Job saved", "success");
    closeModal();
    load();
  }
});

async function load() {
  showLoading(root);
  const [{ data: jobs, error }, { data: apps }] = await Promise.all([
    api.jobs.list(),
    api.applications.listAll(),
  ]);
  if (error) {
    root.innerHTML = emptyState("Error", error.message);
    return;
  }
  const counts = {};
  (apps || []).forEach((a) => {
    counts[a.job_id] = (counts[a.job_id] || 0) + 1;
  });

  if (!jobs.length) {
    root.innerHTML = emptyState("No jobs", "Create your first job posting.");
    return;
  }

  root.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Location</th>
            <th>Status</th>
            <th>Apps</th>
            <th>Posted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${jobs
            .map(
              (j) => `
            <tr>
              <td>
                <strong>${escapeHtml(j.title)}</strong>
                ${j.urgent ? ' <span class="badge" style="background:#FDECEA;color:#C62828;">Urgent</span>' : ""}
                <div class="text-muted">${escapeHtml(j.category || "")}</div>
              </td>
              <td>${escapeHtml(j.location || "—")}</td>
              <td><span class="chip chip-${j.status === "open" ? "open" : "closed"}">${escapeHtml(j.status)}</span></td>
              <td>${counts[j.id] || 0}</td>
              <td>${formatDate(j.created_at)}</td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="btn btn-outline btn-sm btn-edit" data-id="${j.id}">Edit</button>
                  ${
                    j.status === "open"
                      ? `<button type="button" class="btn btn-ghost btn-sm btn-close" data-id="${j.id}">Close</button>`
                      : `<button type="button" class="btn btn-ghost btn-sm btn-open" data-id="${j.id}">Reopen</button>`
                  }
                  <button type="button" class="btn btn-danger btn-sm btn-del" data-id="${j.id}">Delete</button>
                </div>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  root.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const job = jobs.find((j) => j.id === btn.dataset.id);
      openModal(job);
    });
  });
  root.querySelectorAll(".btn-close").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.jobs.close(btn.dataset.id);
      toast("Job closed", "success");
      load();
    });
  });
  root.querySelectorAll(".btn-open").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.jobs.update(btn.dataset.id, { status: "open" });
      toast("Job reopened", "success");
      load();
    });
  });
  root.querySelectorAll(".btn-del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this job posting?")) return;
      await api.jobs.remove(btn.dataset.id);
      toast("Deleted", "success");
      load();
    });
  });
}

await load();