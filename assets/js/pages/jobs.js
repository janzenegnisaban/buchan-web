import { fetchOpenJobs, jobCardHtml } from "../jobs-fetch.js";

const listEl = document.getElementById("jobs-list");

// Header/footer are optional — never block job listing on them
import("../ui.js")
  .then(({ renderHeader, renderFooter }) => {
    renderHeader("jobs").catch(() => {});
    renderFooter();
  })
  .catch((err) => console.warn("Header/footer skipped", err));

async function load() {
  listEl.innerHTML = `<div class="loading-block"><div class="spinner"></div><p>Loading openings…</p></div>`;
  const filters = {
    status: "open",
    search: document.getElementById("q")?.value.trim() || "",
    category: document.getElementById("category")?.value || "",
    employment_type: document.getElementById("employment_type")?.value || "",
    location: document.getElementById("location")?.value.trim() || "",
  };

  const { data: jobs, error } = await fetchOpenJobs(filters);
  if (error) {
    listEl.innerHTML = `<div class="empty-state"><h3>Unable to load jobs</h3><p>${error.message}</p></div>`;
    return;
  }
  if (!jobs.length) {
    listEl.innerHTML = `<div class="empty-state"><h3>No matching jobs</h3><p>Try clearing filters or check back later.</p></div>`;
    return;
  }

  const catSel = document.getElementById("category");
  if (catSel && catSel.options.length <= 1) {
    const { data: all } = await fetchOpenJobs({ status: "open" });
    const cats = [...new Set((all || []).map((j) => j.category).filter(Boolean))];
    cats.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      catSel.appendChild(opt);
    });
    if (filters.category) catSel.value = filters.category;
  }

  listEl.innerHTML = jobs.map(jobCardHtml).join("");
}

document.getElementById("btn-filter")?.addEventListener("click", load);
["q", "category", "employment_type", "location"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    clearTimeout(window.__jobFilterT);
    window.__jobFilterT = setTimeout(load, 220);
  });
  el.addEventListener("change", load);
});
document.getElementById("q")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") load();
});

load().catch((err) => {
  console.error(err);
  listEl.innerHTML = `<div class="empty-state"><h3>Unable to load jobs</h3><p>${String(err?.message || err)}</p></div>`;
});
