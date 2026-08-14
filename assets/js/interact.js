/**
 * Scroll reveals, counters, header glass, back-to-top.
 */

export function jobCover(job, prefix = "") {
  const byId = {
    "job-barista-subic": "jobs/barista.jpg",
    "job-barista-clark": "jobs/barista.jpg",
    "job-service-crew-clark": "jobs/service.jpg",
    "job-service-crew-subic": "jobs/service.jpg",
    "job-production-operators": "jobs/production.jpg",
    "job-skilled-sewer": "jobs/sewing.jpg",
    "job-hr-coordinator": "jobs/hr.jpg",
    "job-qc-support": "jobs/docs.jpg",
    "job-materials-control": "jobs/warehouse.jpg",
    "job-engineering-support": "jobs/engineering.jpg",
    "job-kitchen-staff": "jobs/kitchen.jpg",
    "job-line-cook": "jobs/kitchen.jpg",
    "job-utility": "jobs/safety.jpg",
    "job-driver": "jobs/warehouse.jpg",
    "job-janitor": "jobs/safety.jpg",
    "job-junior-hairstylist": "jobs/interview.jpg",
  };
  const byCat = {
    Production: "jobs/production.jpg",
    Garments: "jobs/sewing.jpg",
    Warehouse: "jobs/warehouse.jpg",
    "Food & Beverage": "jobs/barista.jpg",
    "Office / HR": "jobs/hr.jpg",
    "Quality Control": "jobs/docs.jpg",
    Engineering: "jobs/engineering.jpg",
    Facilities: "jobs/safety.jpg",
    Logistics: "jobs/warehouse.jpg",
    "Personal Care": "jobs/interview.jpg",
    General: "jobs/docs.jpg",
  };
  const file = byId[job.id] || byCat[job.category] || "jobs/docs.jpg";
  return `${prefix}assets/img/${file}`;
}

export function jobCardHtml(job, { prefix = "", escapeHtml }) {
  const urgent = job.urgent
    ? '<span class="badge badge-urgent">Urgent</span>'
    : "";
  const snippet = (job.description || "").slice(0, 100);
  const more = (job.description || "").length > 100 ? "…" : "";
  return `
    <article class="card card-hover job-card">
      <div class="job-cover">
        <img src="${jobCover(job, prefix)}" alt="${escapeHtml(job.title)}" loading="lazy" />
        <div class="cover-badges">
          ${urgent}
          <span class="chip chip-open">Open</span>
        </div>
      </div>
      <div class="card-body">
        <span class="badge">${escapeHtml(job.category || "")}</span>
        <h3 class="card-title">${escapeHtml(job.title)}</h3>
        <p class="card-meta">${escapeHtml(job.location || "—")} · ${escapeHtml(job.employment_type || "")}</p>
        <p class="text-muted mb-0">${escapeHtml(snippet)}${more}</p>
      </div>
      <div class="card-actions">
        <a class="btn btn-primary btn-sm" href="${prefix}job.html?id=${encodeURIComponent(job.id)}">Apply now</a>
      </div>
    </article>
  `;
}

export function initMotion() {
  if (window.__bgscMotion) {
    observeReveals();
    return;
  }
  window.__bgscMotion = true;

  const header = document.querySelector(".site-header");
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    const topBtn = document.querySelector(".back-top");
    topBtn?.classList.toggle("is-visible", window.scrollY > 480);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (!document.querySelector(".back-top") && document.getElementById("site-footer")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.textContent = "↑";
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(btn);
  }

  observeReveals();
  animateCounters();

  const main = document.querySelector("main") || document.body;
  const mo = new MutationObserver(() => observeReveals());
  mo.observe(main, { childList: true, subtree: true });
}

function observeReveals() {
  const nodes = document.querySelectorAll(".reveal:not(.is-in)");
  if (!nodes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  nodes.forEach((n) => io.observe(n));
}

function animateCounters() {
  const els = document.querySelectorAll("[data-count]");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const prefix = el.dataset.prefix || "";
        const duration = 1100;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = Math.round(target * eased);
          el.textContent = `${prefix}${val.toLocaleString()}${suffix}`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => io.observe(el));
}