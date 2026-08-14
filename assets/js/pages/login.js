import { api } from "../api.js";
import { getNextUrl } from "../auth.js";
import { assertHttpOrigin } from "../origin-guard.js";
import { renderHeader, renderFooter, toast } from "../ui.js";
import { validateForm, email, required, minLength } from "../validate.js";

if (!assertHttpOrigin()) {
  // Still paint chrome, but auth cannot work on file://
}

await renderHeader();
renderFooter();

const form = document.getElementById("login-form");
const alertEl = document.getElementById("login-alert");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (location.protocol === "file:") {
    alertEl.textContent = "Open http://localhost:5173/login.html after running npm start.";
    alertEl.classList.remove("hidden");
    return;
  }
  alertEl.classList.add("hidden");
  const { ok, values } = validateForm(form, {
    email,
    password: (v) => required(v, "Password") || minLength(v, 1, "Password"),
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
  if (!data) {
    alertEl.textContent = "Signed in, but profile could not be loaded. Try again.";
    alertEl.classList.remove("hidden");
    return;
  }

  toast("Welcome back!", "success");
  if (data.role === "admin") {
    location.href = getNextUrl("admin/dashboard.html");
  } else {
    location.href = getNextUrl("portal/dashboard.html");
  }
});
