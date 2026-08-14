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
  formatDate,
  formatTime,
  formatDateTime,
  statusChip,
} from "../ui.js";

const user = await requireUser({ role: "applicant", loginPath: "../login.html" });
if (!user) throw new Error("redirect");

await renderHeader();
renderFooter();
renderPortalSidebar("appointment");

const root = document.getElementById("appt-root");
const appParam = getParam("app");

const { data: apps } = await api.applications.listMine();
const bookable = (apps || []).filter((a) =>
  ["qualified", "interview_scheduled"].includes(a.status)
);

if (!bookable.length) {
  const pending = (apps || []).filter((a) =>
    ["submitted", "under_review"].includes(a.status)
  );
  root.innerHTML = emptyState(
    "No interview booking yet",
    pending.length
      ? "Your application is still under review. Once marked Qualified, you can pick an open slot here."
      : "Apply to a job and wait for qualification before booking an office appointment.",
    `<a class="btn btn-primary" href="dashboard.html">Back to dashboard</a>`
  );
} else {
  const selected =
    appParam && bookable.some((a) => a.id === appParam) ? appParam : bookable[0].id;
  await render(selected);
}

async function render(applicationId) {
  const app = bookable.find((a) => a.id === applicationId) || bookable[0];
  const [{ data: slots }, { data: company }] = await Promise.all([
    api.slots.listOpen(),
    api.meta.getCompany(),
  ]);

  const current = app.appointment && app.appointment.status === "scheduled" ? app.appointment : null;
  let selectedSlot = null;

  root.innerHTML = `
    <div class="card mb-4">
      <div class="form-group mb-0">
        <label class="form-label" for="app-select">Qualified application</label>
        <select class="form-control" id="app-select">
          ${bookable
            .map(
              (a) =>
                `<option value="${a.id}" ${a.id === app.id ? "selected" : ""}>${escapeHtml(a.job?.title || "Job")} — ${escapeHtml(a.status)}</option>`
            )
            .join("")}
        </select>
      </div>
      <p class="mt-4 mb-0">${statusChip(app.status)}</p>
    </div>

    ${
      current
        ? `<div class="card mb-4" style="border-left:4px solid var(--color-success);">
            <h3 class="mt-0">Confirmed appointment</h3>
            <p><strong>${formatDateTime(current.starts_at)}</strong></p>
            <p class="text-muted">Interview locations — Subic: ${escapeHtml(company?.branches?.[0]?.address || "")}; Clark: ${escapeHtml(company?.branches?.[1]?.address || "")}</p>
            <p class="text-muted mb-4">Please bring original documents and a valid ID. Arrive 15 minutes early. Confirm which branch with HR when you book.</p>
            <button type="button" class="btn btn-outline btn-sm" id="btn-reschedule">Reschedule / change slot</button>
          </div>`
        : ""
    }

    <div class="card ${current ? "hidden" : ""}" id="slot-picker">
      <h3 class="mt-0">${current ? "Choose a new slot" : "Choose an open slot"}</h3>
      <p class="text-muted">Admin-published interview times at our office. Capacity is limited.</p>
      <div class="slot-grid" id="slot-grid">
        ${(slots || []).length
          ? slots
              .map((s) => {
                const remaining = s.capacity - s.booked_count;
                return `
              <button type="button" class="slot-card" data-id="${s.id}">
                <div class="slot-date">${formatDate(s.starts_at)}</div>
                <div class="slot-time">${formatTime(s.starts_at)} – ${formatTime(s.ends_at)}</div>
                <div class="slot-cap">${remaining} seat${remaining === 1 ? "" : "s"} left</div>
              </button>`;
              })
              .join("")
          : `<p class="text-muted">No open slots right now. Please check again later.</p>`}
      </div>
      <button type="button" class="btn btn-primary mt-6" id="btn-book" disabled>Confirm booking</button>
    </div>
  `;

  document.getElementById("app-select").addEventListener("change", (e) => {
    history.replaceState(null, "", `?app=${encodeURIComponent(e.target.value)}`);
    // refresh apps for appointment data
    api.applications.listMine().then(({ data }) => {
      bookable.splice(
        0,
        bookable.length,
        ...data.filter((a) => ["qualified", "interview_scheduled"].includes(a.status))
      );
      render(e.target.value);
    });
  });

  document.getElementById("btn-reschedule")?.addEventListener("click", () => {
    document.getElementById("slot-picker").classList.remove("hidden");
  });

  root.querySelectorAll(".slot-card").forEach((card) => {
    card.addEventListener("click", () => {
      root.querySelectorAll(".slot-card").forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      selectedSlot = card.dataset.id;
      document.getElementById("btn-book").disabled = false;
    });
  });

  document.getElementById("btn-book")?.addEventListener("click", async () => {
    if (!selectedSlot) return;
    const btn = document.getElementById("btn-book");
    btn.disabled = true;
    btn.textContent = "Booking…";
    const { error } = await api.appointments.book({
      application_id: app.id,
      slot_id: selectedSlot,
    });
    if (error) {
      toast(error.message, "error");
      btn.disabled = false;
      btn.textContent = "Confirm booking";
      return;
    }
    toast("Appointment booked!", "success");
    const { data } = await api.applications.listMine();
    bookable.splice(
      0,
      bookable.length,
      ...data.filter((a) => ["qualified", "interview_scheduled"].includes(a.status))
    );
    render(app.id);
  });
}