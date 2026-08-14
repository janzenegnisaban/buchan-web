import { api } from "../api.js";
import { requireUser } from "../auth.js";
import {
  renderAdminSidebar,
  initAdminShell,
  escapeHtml,
  formatDateTime,
  emptyState,
  showLoading,
  toast,
} from "../ui.js";

const user = await requireUser({ role: "admin", loginPath: "login.html" });
if (!user) throw new Error("redirect");

renderAdminSidebar("slots");
initAdminShell();

const table = document.getElementById("slots-table");

function toISO(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

document.getElementById("slot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const capacity = document.getElementById("capacity").value;
  const { error } = await api.slots.create({
    starts_at: toISO(date, start),
    ends_at: toISO(date, end),
    capacity,
  });
  if (error) toast(error.message, "error");
  else {
    toast("Slot published", "success");
    e.target.reset();
    document.getElementById("capacity").value = 3;
    load();
  }
});

document.getElementById("bulk-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const startDate = new Date(document.getElementById("bulk_start").value + "T00:00:00");
  const capacity = Number(document.getElementById("bulk_cap").value) || 3;
  const hours = [9, 10, 11, 13, 14, 15];
  const list = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    for (const h of hours) {
      const s = new Date(day);
      s.setHours(h, 0, 0, 0);
      const en = new Date(day);
      en.setHours(h + 1, 0, 0, 0);
      list.push({ starts_at: s.toISOString(), ends_at: en.toISOString(), capacity });
    }
  }
  const { data, error } = await api.slots.createBulk(list);
  if (error) toast(error.message, "error");
  else {
    toast(`Created ${data.length} slots`, "success");
    load();
  }
});

async function load() {
  showLoading(table);
  const { data, error } = await api.slots.listAll();
  if (error) {
    table.innerHTML = emptyState("Error", error.message);
    return;
  }
  const upcoming = (data || []).filter((s) => new Date(s.starts_at) > new Date());
  if (!upcoming.length) {
    table.innerHTML = emptyState("No upcoming slots", "Add slots so qualified applicants can book.");
    return;
  }
  table.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>When</th><th>Capacity</th><th>Booked</th><th></th></tr>
        </thead>
        <tbody>
          ${upcoming
            .map(
              (s) => `
            <tr>
              <td>${formatDateTime(s.starts_at)} – ${new Date(s.ends_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}</td>
              <td>${s.capacity}</td>
              <td>${s.booked_count}</td>
              <td>
                ${
                  s.booked_count === 0
                    ? `<button type="button" class="btn btn-danger btn-sm btn-del" data-id="${s.id}">Delete</button>`
                    : `<span class="text-muted">In use</span>`
                }
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  table.querySelectorAll(".btn-del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await api.slots.remove(btn.dataset.id);
      if (error) toast(error.message, "error");
      else {
        toast("Deleted", "success");
        load();
      }
    });
  });
}

await load();