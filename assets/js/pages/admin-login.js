import { api } from "../api.js";
import { toast } from "../ui.js";
import { validateForm, email, required } from "../validate.js";

const form = document.getElementById("admin-login-form");
const alertEl = document.getElementById("alert");

// If already admin, go to dashboard
const { data: user } = await api.auth.getUser();
if (user?.role === "admin") location.href = "dashboard.html";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertEl.classList.add("hidden");
  const { ok, values } = validateForm(form, {
    email,
    password: (v) => required(v, "Password"),
  });
  if (!ok) return;
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  const { data, error } = await api.auth.signIn(values);
  btn.disabled = false;
  if (error) {
    alertEl.textContent = error.message;
    alertEl.classList.remove("hidden");
    return;
  }
  if (data.role !== "admin") {
    await api.auth.signOut();
    alertEl.textContent = "This account is not an admin.";
    alertEl.classList.remove("hidden");
    return;
  }
  toast("Welcome, admin", "success");
  location.href = "dashboard.html";
});