import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderAdminSidebar,
  initAdminShell,
  escapeHtml,
  formatDate,
  formatTime,
  emptyState,
  toast,
} from "../ui.js";

const user = await requireUser({ role: "admin", loginPath: "login.html" });
if (!user) throw new Error("redirect");

renderAdminSidebar("appointments");
initAdminShell();

const root = document.getElementById("appts-root");

async function load() {
  const { data, error } = await api.appointments.listAll();
  if (error) {
    root.innerHTML = emptyState("Error", error.message);
    return;
  }
  const active = (data || []).filter((a) => a.status !== "cancelled");
  if (!active.length) {
    root.innerHTML = emptyState("No appointments", "Bookings will appear here when applicants claim slots.");
    return;
  }

  // Group by date
  const groups = {};
  active.forEach((a) => {
    const key = formatDate(a.starts_at);
    (groups[key] ||= []).push(a);
  });

  root.innerHTML = Object.entries(groups)
    .map(
      ([day, items]) => `
    <div class="calendar-day">
      <h4>${escapeHtml(day)}</h4>
      ${items
        .map(
          (a) => `
        <div class="appt-row">
          <div>
            <strong>${formatTime(a.starts_at)} – ${formatTime(a.ends_at)}</strong><br />
            ${escapeHtml(a.applicant?.full_name || "—")} · ${escapeHtml(a.job?.title || "")}<br />
            <span class="chip chip-${a.status === "scheduled" ? "interview_scheduled" : a.status === "completed" ? "interviewed" : "not_qualified"}">${escapeHtml(a.status)}</span>
            ${a.outcome ? ` · ${escapeHtml(a.outcome)}` : ""}
          </div>
          <div class="admin-actions">
            ${
              a.status === "scheduled"
                ? `
              <button type="button" class="btn btn-success btn-sm btn-show" data-id="${a.id}" data-app="${a.application_id}">Showed up</button>
              <button type="button" class="btn btn-outline btn-sm btn-noshow" data-id="${a.id}">No-show</button>
              <button type="button" class="btn btn-primary btn-sm btn-hire" data-id="${a.id}">Hired</button>
              <button type="button" class="btn btn-ghost btn-sm btn-pool" data-id="${a.id}">Talent pool</button>
            `
                : ""
            }
            ${a.application_id ? `<a class="btn btn-outline btn-sm" href="applicant.html?id=${a.application_id}">Open</a>` : ""}
          </div>
        </div>`
        )
        .join("")}
    </div>`
    )
    .join("");

  root.querySelectorAll(".btn-show").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.appointments.setOutcome(btn.dataset.id, {
        status: "completed",
        outcome: "interviewed",
      });
      if (error) toast(error.message, "error");
      else {
        toast("Marked interviewed", "success");
        load();
      }
    });
  });
  root.querySelectorAll(".btn-noshow").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.appointments.setOutcome(btn.dataset.id, {
        status: "no_show",
        outcome: "no_show",
      });
      if (error) toast(error.message, "error");
      else {
        toast("Marked no-show", "success");
        load();
      }
    });
  });
  root.querySelectorAll(".btn-hire").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.appointments.setOutcome(btn.dataset.id, {
        status: "completed",
        outcome: "hired",
      });
      if (error) toast(error.message, "error");
      else {
        toast("Marked hired", "success");
        load();
      }
    });
  });
  root.querySelectorAll(".btn-pool").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.appointments.setOutcome(btn.dataset.id, {
        status: "completed",
        outcome: "talent_pool",
      });
      if (error) toast(error.message, "error");
      else {
        toast("Moved to talent pool", "success");
        load();
      }
    });
  });
}

await load();