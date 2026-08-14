import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderAdminSidebar,
  initAdminShell,
  escapeHtml,
  statusChip,
  formatDateTime,
  formatDate,
  formatTime,
  emptyState,
  getParam,
  toast,
} from "../ui.js";

const user = await requireUser({ role: "admin", loginPath: "login.html" });
if (!user) throw new Error("redirect");

renderAdminSidebar("applicants");
initAdminShell();

const root = document.getElementById("detail-root");
const id = getParam("id");

if (!id) {
  root.innerHTML = emptyState("Missing id", "", `<a class="btn btn-primary" href="applicants.html">Back</a>`);
} else {
  await load();
}

async function load() {
  const [{ data: app, error }, { data: docTypes }, { data: slots }] = await Promise.all([
    api.applications.get(id),
    api.meta.getDocumentTypes(),
    api.slots.listOpen(),
  ]);
  if (error || !app) {
    root.innerHTML = emptyState("Not found", error?.message || "", `<a href="applicants.html">Back</a>`);
    return;
  }

  const label = (k) => (docTypes || []).find((d) => d.key === k)?.label || k;
  const p = app.applicant || {};

  root.innerHTML = `
    <p class="mb-4"><a href="applicants.html">&larr; All applicants</a></p>
    <div class="content-grid content-grid-sidebar">
      <div>
        <div class="admin-panel">
          <div class="portal-header">
            <div>
              <h2 class="mt-0 mb-2">${escapeHtml(p.full_name || "Applicant")}</h2>
              <p class="text-muted mb-0">${escapeHtml(p.email || "")} · ${escapeHtml(p.phone || "No phone")}</p>
            </div>
            ${statusChip(app.status)}
          </div>
          <p><strong>Job:</strong> ${escapeHtml(app.job?.title || "—")}</p>
          <p><strong>Applied:</strong> ${formatDateTime(app.created_at)}</p>
          ${app.cover_letter ? `<p><strong>Cover note:</strong> ${escapeHtml(app.cover_letter)}</p>` : ""}
          ${app.status_reason ? `<p><strong>Status reason:</strong> ${escapeHtml(app.status_reason)}</p>` : ""}
          <h3>Profile</h3>
          <p class="text-muted mb-1"><strong>Address:</strong> ${escapeHtml(p.address || "—")}</p>
          <p class="text-muted mb-1"><strong>Education:</strong> ${escapeHtml(p.education || "—")}</p>
          <p class="text-muted mb-1"><strong>Experience:</strong> ${escapeHtml(p.experience || "—")}</p>
          <p class="text-muted"><strong>Skills:</strong> ${escapeHtml(p.skills || "—")}</p>
        </div>

        <div class="admin-panel">
          <h2>Documents</h2>
          <div class="doc-list">
            ${(app.documents || []).length
              ? app.documents
                  .map(
                    (d) => `
              <div class="doc-item">
                <div class="doc-info">
                  <div class="doc-name">${escapeHtml(label(d.doc_type))}</div>
                  <div class="text-muted" style="font-size:var(--font-size-xs);">${escapeHtml(d.file_name)}</div>
                </div>
                <span class="chip chip-${d.status}">${escapeHtml(d.status)}</span>
                <div class="doc-actions">
                  <button type="button" class="btn btn-outline btn-sm btn-view" data-id="${d.id}">View</button>
                  <button type="button" class="btn btn-success btn-sm btn-verify" data-id="${d.id}">Verify</button>
                  <button type="button" class="btn btn-danger btn-sm btn-reject-doc" data-id="${d.id}">Reject</button>
                </div>
              </div>`
                  )
                  .join("")
              : `<p class="text-muted">No documents uploaded yet.</p>`}
          </div>
          <div id="doc-preview-area"></div>
        </div>

        <div class="admin-panel">
          <h2>Timeline / notes</h2>
          <ul class="notes-list">
            ${(app.notes || [])
              .slice()
              .reverse()
              .map(
                (n) => `
              <li>
                <div class="note-meta">${formatDateTime(n.created_at)}${n.is_system ? " · system" : ""}</div>
                ${escapeHtml(n.body)}
              </li>`
              )
              .join("") || "<li>No notes</li>"}
          </ul>
          <form id="note-form" class="mt-4">
            <div class="form-group">
              <label class="form-label" for="note">Add internal note</label>
              <textarea class="form-control" id="note" name="note" required></textarea>
            </div>
            <button type="submit" class="btn btn-outline btn-sm">Add note</button>
          </form>
        </div>
      </div>

      <aside>
        <div class="admin-panel">
          <h2>Qualification</h2>
          <p class="text-muted">Mark whether this applicant may book an office interview.</p>
          <div class="form-group">
            <label class="form-label" for="reason">Reason (required for Not Qualified)</label>
            <textarea class="form-control" id="reason" placeholder="Optional notes / required if not qualified"></textarea>
          </div>
          <div class="admin-actions">
            <button type="button" class="btn btn-success" id="btn-qualify">Qualified</button>
            <button type="button" class="btn btn-danger" id="btn-not-qualify">Not qualified</button>
          </div>
          <div class="admin-actions">
            <button type="button" class="btn btn-outline btn-sm" data-status="under_review">Under review</button>
            <button type="button" class="btn btn-outline btn-sm" data-status="hired">Hired</button>
            <button type="button" class="btn btn-outline btn-sm" data-status="talent_pool">Talent pool</button>
          </div>
        </div>

        <div class="admin-panel">
          <h2>Schedule interview</h2>
          ${
            app.appointment && app.appointment.status === "scheduled"
              ? `<p>Current: <strong>${formatDateTime(app.appointment.starts_at)}</strong></p>`
              : `<p class="text-muted">No active appointment.</p>`
          }
          <div class="form-group">
            <label class="form-label" for="slot">Open slot</label>
            <select class="form-control" id="slot">
              <option value="">Select…</option>
              ${(slots || [])
                .map(
                  (s) =>
                    `<option value="${s.id}">${formatDate(s.starts_at)} ${formatTime(s.starts_at)} (${s.capacity - s.booked_count} left)</option>`
                )
                .join("")}
            </select>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-schedule">Book for applicant</button>
          <p class="form-hint">Applicant must be Qualified (or already scheduled) to book.</p>
        </div>
      </aside>
    </div>
  `;

  document.getElementById("btn-qualify").addEventListener("click", async () => {
    const reason = document.getElementById("reason").value.trim();
    const { error } = await api.applications.setStatus(id, "qualified", reason);
    if (error) toast(error.message, "error");
    else {
      toast("Marked qualified", "success");
      load();
    }
  });

  document.getElementById("btn-not-qualify").addEventListener("click", async () => {
    const reason = document.getElementById("reason").value.trim();
    if (!reason) {
      toast("Please provide a reason for Not Qualified", "error");
      return;
    }
    const { error } = await api.applications.setStatus(id, "not_qualified", reason);
    if (error) toast(error.message, "error");
    else {
      toast("Marked not qualified", "success");
      load();
    }
  });

  root.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.applications.setStatus(id, btn.dataset.status, document.getElementById("reason").value.trim());
      if (error) toast(error.message, "error");
      else {
        toast("Status updated", "success");
        load();
      }
    });
  });

  document.getElementById("note-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = document.getElementById("note").value.trim();
    const { error } = await api.applications.addNote(id, body);
    if (error) toast(error.message, "error");
    else {
      toast("Note added", "success");
      load();
    }
  });

  document.getElementById("btn-schedule").addEventListener("click", async () => {
    const slot_id = document.getElementById("slot").value;
    if (!slot_id) return toast("Select a slot", "error");
    // Ensure qualified first if needed
    if (!["qualified", "interview_scheduled"].includes(app.status)) {
      await api.applications.setStatus(id, "qualified", "Qualified for scheduling by admin");
    }
    const { error } = await api.appointments.book({ application_id: id, slot_id });
    if (error) toast(error.message, "error");
    else {
      toast("Interview scheduled", "success");
      load();
    }
  });

  root.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { data, error } = await api.documents.getUrl(btn.dataset.id);
      if (error) return toast(error.message, "error");
      const area = document.getElementById("doc-preview-area");
      if ((data.mime_type || "").startsWith("image/")) {
        area.innerHTML = `<img class="doc-preview" src="${data.url}" alt="${escapeHtml(data.file_name)}" />`;
      } else {
        area.innerHTML = `<p class="mt-4"><a class="btn btn-outline btn-sm" href="${data.url}" download="${escapeHtml(data.file_name)}" target="_blank">Open / download ${escapeHtml(data.file_name)}</a></p>`;
      }
    });
  });

  root.querySelectorAll(".btn-verify").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.documents.setStatus(btn.dataset.id, "verified");
      if (error) toast(error.message, "error");
      else {
        toast("Document verified", "success");
        load();
      }
    });
  });

  root.querySelectorAll(".btn-reject-doc").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const note = prompt("Rejection reason (shown to applicant):") || "Please re-upload a clearer copy";
      const { error } = await api.documents.setStatus(btn.dataset.id, "rejected", note);
      if (error) toast(error.message, "error");
      else {
        toast("Document rejected", "success");
        load();
      }
    });
  });
}