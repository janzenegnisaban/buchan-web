/**
 * ui.js — shared layout rendering and small UI helpers
 */

import { logout, pathPrefix } from "./auth.js";
import { initMotion } from "./interact.js";

export const ADMIN_TRIGGER_WORD = "Corporation";

export const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  qualified: "Qualified",
  not_qualified: "Not Qualified",
  interview_scheduled: "Interview Scheduled",
  interviewed: "Interviewed",
  hired: "Hired",
  talent_pool: "Talent Pool",
};

export function statusChip(status) {
  const label = STATUS_LABELS[status] || status || "—";
  const cls = status ? `chip chip-${status}` : "chip";
  return `<span class="${cls}">${escapeHtml(label)}</span>`;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function toast(message, type = "info") {
  let box = qs(".toast-container");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast-container";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => {
    el.remove();
    if (!box.children.length) box.remove();
  }, 3200);
}

export function showLoading(el, text = "Loading…") {
  if (!el) return;
  el.innerHTML = `<div class="loading-block"><div class="spinner"></div><p>${escapeHtml(text)}</p></div>`;
}

export function emptyState(title, message, actionHtml = "") {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>${actionHtml}</div>`;
}

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/** Render public site header into #site-header */
export async function renderHeader(active = "") {
  const el = qs("#site-header");
  if (!el) return;
  const p = pathPrefix();
  paintHeader(el, p, active, null);
  ensureBrandAssets(p);
  initMotion();
  try {
    const { currentUser } = await import("./auth.js");
    const user = await Promise.race([
      currentUser(),
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    paintHeader(el, p, active, user);
  } catch {
    /* keep guest header */
  }
}

function paintHeader(el, p, active, user) {
  let authLinks = "";
  if (user) {
    const dash = user.role === "admin" ? `${p}admin/dashboard.html` : `${p}portal/dashboard.html`;
    authLinks = `
      <a href="${dash}">${escapeHtml(user.full_name || "My Portal")}</a>
      <button type="button" class="btn btn-outline btn-sm" id="header-logout">Sign out</button>
    `;
  } else {
    authLinks = `
      <a href="${p}login.html">Sign in</a>
      <a href="${p}register.html" class="btn btn-primary btn-sm nav-cta">Register</a>
    `;
  }

  el.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="${p}index.html">
        <img src="${p}assets/img/logo.png" alt="Buchan Global Services Corporation logo" />
        <span class="brand-text">Buchan Global<small>Services Corporation</small></span>
      </a>
      <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-hidden="true">
        <a href="${p}index.html" class="${active === "home" ? "is-active" : ""}">Home</a>
        <a href="${p}about.html" class="${active === "about" ? "is-active" : ""}">About</a>
        <a href="${p}services.html" class="${active === "services" ? "is-active" : ""}">Services</a>
        <a href="${p}jobs.html" class="${active === "jobs" ? "is-active" : ""}">Jobs</a>
        <a href="${p}contact.html" class="${active === "contact" ? "is-active" : ""}">Contact</a>
        ${authLinks}
      </nav>
    </div>
    <div class="nav-scrim" id="nav-scrim" hidden></div>
  `;
  bindMobileNav();
  qs("#header-logout")?.addEventListener("click", () => logout(`${p}index.html`));
}

function bindMobileNav() {
  const toggle = qs("#nav-toggle");
  const nav = qs("#site-nav");
  const scrim = qs("#nav-scrim");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    const isDesktop = window.matchMedia("(min-width: 900px)").matches;
    nav.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    scrim?.classList.toggle("is-open", open);
    if (scrim) scrim.hidden = isDesktop || !open;
    document.body.classList.toggle("nav-open", open && !isDesktop);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.setAttribute("aria-hidden", String(!isDesktop && !open));
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!nav.classList.contains("is-open"));
  });
  scrim?.addEventListener("click", () => setOpen(false));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 900px)").matches) setOpen(false);
  });
  setOpen(false);
}

function ensureBrandAssets(prefix) {
  if (!document.getElementById("bgsc-fonts")) {
    const pre = document.createElement("link");
    pre.rel = "preconnect";
    pre.href = "https://fonts.googleapis.com";
    pre.id = "bgsc-fonts";
    document.head.appendChild(pre);
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    document.head.appendChild(pre2);
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(fonts);
  }
  if (!document.getElementById("bgsc-motion-css")) {
    const css = document.createElement("link");
    css.id = "bgsc-motion-css";
    css.rel = "stylesheet";
    css.href = `${prefix}assets/css/motion.css`;
    document.head.appendChild(css);
  }
}

/** Render public footer with hidden admin trigger on ADMIN_TRIGGER_WORD */
export function renderFooter() {
  const el = qs("#site-footer");
  if (!el) return;
  const p = pathPrefix();
  const year = new Date().getFullYear();
  // Split so "Corporation" is the invisible admin gate
  const before = "Buchan Global Services ";
  const after = ". All rights reserved.";

  el.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="${p}assets/img/logo.png" alt="" />
          <div>
            <h4>Buchan Global Services Corporation</h4>
            <p>100% Filipino-owned Manpower Services Company. Established April 2010.</p>
          </div>
        </div>
        <div class="footer-col">
          <h5>Explore</h5>
          <ul>
            <li><a href="${p}about.html">About Us</a></li>
            <li><a href="${p}services.html">Services</a></li>
            <li><a href="${p}jobs.html">Job Openings</a></li>
            <li><a href="${p}contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h5>Contact</h5>
          <ul>
            <li><strong>Subic</strong><br />047-603-1583 · <a href="mailto:buchan_recruitment@yahoo.com">buchan_recruitment@yahoo.com</a></li>
            <li><strong>Clark</strong><br />(045)-599-3928 · <a href="mailto:buchanglobal.clark@gmail.com">buchanglobal.clark@gmail.com</a></li>
            <li>Hiring areas: SBMA / Zambales / Bataan / Clark</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${year} ${before}<button type="button" class="admin-trigger" id="admin-trigger" title="">${ADMIN_TRIGGER_WORD}</button>${after}
      </div>
    </div>
  `;

  qs("#admin-trigger")?.addEventListener("click", (e) => {
    e.preventDefault();
    location.href = `${p}admin/login.html`;
  });
  initMotion();
}

export function renderPortalSidebar(active = "") {
  const el = qs("#portal-sidebar");
  if (!el) return;
  el.innerHTML = `
    <h3>Applicant Portal</h3>
    <nav>
      <a href="dashboard.html" class="${active === "dashboard" ? "is-active" : ""}">Dashboard</a>
      <a href="profile.html" class="${active === "profile" ? "is-active" : ""}">My Profile</a>
      <a href="documents.html" class="${active === "documents" ? "is-active" : ""}">Documents</a>
      <a href="appointment.html" class="${active === "appointment" ? "is-active" : ""}">Appointment</a>
      <a href="../jobs.html">Browse Jobs</a>
    </nav>
  `;
}

export function renderAdminSidebar(active = "") {
  const el = qs("#admin-sidebar-nav");
  if (!el) return;
  el.innerHTML = `
    <a href="dashboard.html" class="${active === "dashboard" ? "is-active" : ""}">Dashboard</a>
    <a href="applicants.html" class="${active === "applicants" ? "is-active" : ""}">Applicants</a>
    <a href="jobs.html" class="${active === "jobs" ? "is-active" : ""}">Jobs</a>
    <a href="slots.html" class="${active === "slots" ? "is-active" : ""}">Interview Slots</a>
    <a href="appointments.html" class="${active === "appointments" ? "is-active" : ""}">Appointments</a>
  `;
}

export function initAdminShell() {
  qs("#admin-nav-toggle")?.addEventListener("click", () => {
    qs("#admin-sidebar")?.classList.toggle("is-open");
  });
  qs("#admin-logout")?.addEventListener("click", () => logout("../index.html"));
}