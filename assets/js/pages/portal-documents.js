import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderHeader,
  renderFooter,
  renderPortalSidebar,
  escapeHtml,
  emptyState,
  getParam,
  toast,
  statusChip,
} from "../ui.js";
import { prepareUpload, bindDropzone } from "../upload.js";

const user = await requireUser({ role: "applicant", loginPath: "../login.html" });
if (!user) throw new Error("redirect");

await renderHeader();
renderFooter();
renderPortalSidebar("documents");

const root = document.getElementById("docs-root");
const appIdParam = getParam("app");

const [{ data: apps }, { data: docTypes }] = await Promise.all([
  api.applications.listMine(),
  api.meta.getDocumentTypes(),
]);

if (!apps?.length) {
  root.innerHTML = emptyState(
    "No applications",
    "Apply to a job first, then upload documents here.",
    `<a class="btn btn-primary" href="../jobs.html">Browse jobs</a>`
  );
} else {
  const selectedId = appIdParam && apps.some((a) => a.id === appIdParam) ? appIdParam : apps[0].id;
  render(selectedId);
}

async function render(applicationId) {
  const app = apps.find((a) => a.id === applicationId);
  const { data: docs } = await api.documents.listFor(applicationId);
  const byType = Object.fromEntries((docs || []).map((d) => [d.doc_type, d]));
  const label = (k) => (docTypes || []).find((d) => d.key === k)?.label || k;

  root.innerHTML = `
    <div class="card mb-4">
      <div class="form-group mb-0">
        <label class="form-label" for="app-select">Application</label>
        <select class="form-control" id="app-select">
          ${apps
            .map(
              (a) =>
                `<option value="${a.id}" ${a.id === applicationId ? "selected" : ""}>${escapeHtml(a.job?.title || "Job")} — ${escapeHtml(a.status)}</option>`
            )
            .join("")}
        </select>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="mt-0">Upload</h3>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label" for="doc_type">Document type</label>
          <select class="form-control" id="doc_type">
            ${(docTypes || [])
              .map((d) => `<option value="${d.key}">${escapeHtml(d.label)}${d.required ? " *" : ""}</option>`)
              .join("")}
          </select>
        </div>
      </div>
      <div class="dropzone" id="dropzone">
        <div class="dropzone-icon">⬆</div>
        <p><strong>Drop file here</strong> or click to browse</p>
        <p class="form-hint">PDF, JPG, PNG, WEBP, DOC/DOCX · max 1.5MB</p>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*" />
      </div>
    </div>

    <div class="card">
      <h3 class="mt-0">Checklist</h3>
      <div class="doc-list" id="checklist">
        ${(docTypes || [])
          .map((t) => {
            const doc = byType[t.key];
            const status = doc ? doc.status : "missing";
            return `
            <div class="doc-item">
              <div class="doc-info">
                <div class="doc-name">${escapeHtml(t.label)}${t.required ? ' <span class="required">*</span>' : ""}</div>
                <div class="text-muted" style="font-size:var(--font-size-xs);">
                  ${doc ? escapeHtml(doc.file_name) : "Not uploaded"}
                  ${doc?.review_note ? ` · ${escapeHtml(doc.review_note)}` : ""}
                </div>
              </div>
              <span class="chip chip-${status}">${escapeHtml(status.replace("_", " "))}</span>
              <div class="doc-actions">
                ${
                  doc
                    ? `<button type="button" class="btn btn-outline btn-sm btn-view" data-id="${doc.id}">View</button>
                       <button type="button" class="btn btn-ghost btn-sm btn-del" data-id="${doc.id}">Remove</button>`
                    : ""
                }
              </div>
            </div>`;
          })
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("app-select").addEventListener("change", (e) => {
    const id = e.target.value;
    history.replaceState(null, "", `?app=${encodeURIComponent(id)}`);
    render(id);
  });

  bindDropzone(document.getElementById("dropzone"), async (files) => {
    const { error: prepErr, payload } = await prepareUpload(files[0]);
    if (prepErr) return toast(prepErr, "error");
    const doc_type = document.getElementById("doc_type").value;
    const { error } = await api.documents.upload({ application_id: applicationId, doc_type, ...payload });
    if (error) toast(error.message, "error");
    else {
      toast("Uploaded", "success");
      const { data: refreshed } = await api.applications.listMine();
      apps.splice(0, apps.length, ...refreshed);
      render(applicationId);
    }
  });

  root.querySelectorAll(".btn-del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this document?")) return;
      const { error } = await api.documents.remove(btn.dataset.id);
      if (error) toast(error.message, "error");
      else {
        toast("Removed", "success");
        render(applicationId);
      }
    });
  });

  root.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { data, error } = await api.documents.getUrl(btn.dataset.id);
      if (error) return toast(error.message, "error");
      const w = window.open();
      if (!w) return toast("Pop-up blocked — allow pop-ups to preview", "error");
      if ((data.mime_type || "").startsWith("image/")) {
        w.document.write(`<img src="${data.url}" style="max-width:100%" alt="" />`);
      } else if (data.mime_type === "application/pdf") {
        w.location = data.url;
      } else {
        w.document.write(`<p>Download: <a href="${data.url}" download="${escapeHtml(data.file_name)}">${escapeHtml(data.file_name)}</a></p>`);
      }
    });
  });
}