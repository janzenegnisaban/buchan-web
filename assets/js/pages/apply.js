import { api } from "../api.js";
import { requireUser } from "../auth.js";
import { renderHeader, renderFooter, escapeHtml, getParam, toast, emptyState } from "../ui.js";
import { prepareUpload, bindDropzone } from "../upload.js";

const user = await requireUser({ role: "applicant", loginPath: "login.html" });
if (!user) throw new Error("redirect");

await renderHeader("jobs");
renderFooter();

const jobId = getParam("job");
const root = document.getElementById("apply-root");

function setStep(n) {
  document.querySelectorAll("#apply-steps .step").forEach((el) => {
    const s = Number(el.dataset.step);
    el.classList.toggle("is-active", s === n);
    el.classList.toggle("is-done", s < n);
  });
}

if (!jobId) {
  root.innerHTML = emptyState("Select a job", "Open a job posting and click Apply.", `<a class="btn btn-primary" href="jobs.html">Browse jobs</a>`);
} else {
  const { data: job, error } = await api.jobs.get(jobId);
  if (error || !job) {
    root.innerHTML = emptyState("Job not found", error?.message || "", `<a class="btn btn-primary" href="jobs.html">Browse jobs</a>`);
  } else {
    // Check existing application
    const { data: mine } = await api.applications.listMine();
    const existing = (mine || []).find((a) => a.job_id === jobId);
    if (existing) {
      setStep(3);
      root.innerHTML = `
        <div class="alert alert-info">You already applied for <strong>${escapeHtml(job.title)}</strong>.</div>
        <p>Continue uploading documents or track status in your portal.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="portal/documents.html?app=${encodeURIComponent(existing.id)}">Upload documents</a>
          <a class="btn btn-outline" href="portal/dashboard.html">Go to portal</a>
        </div>
      `;
    } else {
      renderForm(job);
    }
  }
}

function renderForm(job) {
  setStep(1);
  root.innerHTML = `
    <div class="card">
      <h2 class="mt-0">Apply: ${escapeHtml(job.title)}</h2>
      <p class="text-muted">${escapeHtml(job.location || "")} · ${escapeHtml(job.employment_type || "")}</p>
      <form id="apply-form">
        <div class="form-group">
          <label class="form-label">Applicant</label>
          <input class="form-control" value="${escapeHtml(user.full_name)} (${escapeHtml(user.email)})" disabled />
        </div>
        <div class="form-group">
          <label class="form-label" for="cover_letter">Cover note / message</label>
          <textarea class="form-control" id="cover_letter" name="cover_letter" placeholder="Brief introduction, availability, or relevant experience…"></textarea>
        </div>
        <div class="alert alert-info">After submitting, you will upload your resume and required IDs on the next step.</div>
        <button type="submit" class="btn btn-primary btn-block">Submit application</button>
      </form>
    </div>
  `;

  document.getElementById("apply-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    setStep(2);
    const cover_letter = document.getElementById("cover_letter").value.trim();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Submitting…";
    const { data: app, error } = await api.applications.create({ job_id: job.id, cover_letter });
    if (error) {
      btn.disabled = false;
      btn.textContent = "Submit application";
      setStep(1);
      toast(error.message, "error");
      return;
    }
    toast("Application submitted!", "success");
    renderDocsStep(app, job);
  });
}

async function renderDocsStep(app, job) {
  setStep(3);
  const { data: docTypes } = await api.meta.getDocumentTypes();
  root.innerHTML = `
    <div class="alert alert-success">Application for <strong>${escapeHtml(job.title)}</strong> submitted.</div>
    <div class="card">
      <h3 class="mt-0">Upload required documents</h3>
      <p class="text-muted">PDF, JPG, PNG, WEBP, DOC/DOCX — max 1.5MB each (prototype limit).</p>
      <div class="form-group">
        <label class="form-label" for="doc_type">Document type</label>
        <select class="form-control" id="doc_type">
          ${(docTypes || []).map((d) => `<option value="${d.key}">${escapeHtml(d.label)}${d.required ? " *" : ""}</option>`).join("")}
        </select>
      </div>
      <div class="dropzone" id="dropzone">
        <div class="dropzone-icon">⬆</div>
        <p><strong>Drop file here</strong> or click to browse</p>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*" />
      </div>
      <div id="doc-list" class="doc-list mt-6"></div>
      <div class="hero-actions mt-6">
        <a class="btn btn-primary" href="portal/dashboard.html">Go to my portal</a>
        <a class="btn btn-outline" href="portal/documents.html?app=${encodeURIComponent(app.id)}">Manage all documents</a>
      </div>
    </div>
  `;

  async function refreshDocs() {
    const { data: docs } = await api.documents.listFor(app.id);
    const list = document.getElementById("doc-list");
    if (!docs?.length) {
      list.innerHTML = `<p class="text-muted">No documents uploaded yet.</p>`;
      return;
    }
    const label = (k) => (docTypes || []).find((d) => d.key === k)?.label || k;
    list.innerHTML = docs.map((d) => `
      <div class="doc-item">
        <div class="doc-info">
          <div class="doc-name">${escapeHtml(label(d.doc_type))}</div>
          <div class="text-muted" style="font-size:var(--font-size-xs);">${escapeHtml(d.file_name)}</div>
        </div>
        <span class="chip chip-${d.status}">${escapeHtml(d.status)}</span>
      </div>
    `).join("");
  }

  bindDropzone(document.getElementById("dropzone"), async (files) => {
    const file = files[0];
    const { error: prepErr, payload } = await prepareUpload(file);
    if (prepErr) {
      toast(prepErr, "error");
      return;
    }
    const doc_type = document.getElementById("doc_type").value;
    const { error } = await api.documents.upload({ application_id: app.id, doc_type, ...payload });
    if (error) toast(error.message, "error");
    else {
      toast("Uploaded", "success");
      await refreshDocs();
    }
  });

  await refreshDocs();
}