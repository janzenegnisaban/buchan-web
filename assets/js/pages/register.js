import { api } from "../api.js";
import { getNextUrl } from "../auth.js";
import { assertHttpOrigin } from "../origin-guard.js";
import { renderHeader, renderFooter, toast } from "../ui.js";
import { validateForm, email, required, minLength } from "../validate.js";

assertHttpOrigin();

await renderHeader();
renderFooter();

const form = document.getElementById("register-form");
const alertEl = document.getElementById("reg-alert");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (location.protocol === "file:") {
    alertEl.textContent = "Open http://localhost:5173/register.html after running npm start.";
    alertEl.classList.remove("hidden");
    return;
  }
  alertEl.classList.add("hidden");
  const { ok, values } = validateForm(form, {
    full_name: (v) => required(v, "Full name"),
    email,
    password: (v) => required(v, "Password") || minLength(v, 6, "Password"),
    phone: () => "",
  });
  if (!ok) return;

  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  const { data, error } = await api.auth.signUp(values);
  btn.disabled = false;

  if (error) {
    let msg = error.message;
    if (/rate limit|Too many signup emails/i.test(msg)) {
      msg =
        'Too many signup emails (Supabase rate limit). For testing: open Supabase → Authentication → Providers → Email and turn Confirm email OFF, wait 1–2 minutes, then try again. Direct link: https://supabase.com/dashboard/project/jmsvobftkciahkldjncf/auth/providers';
    }
    alertEl.className = "alert alert-error";
    alertEl.innerHTML = msg.replace(
      /(https:\/\/supabase\.com\/dashboard\/project\/[^\s]+)/,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    alertEl.classList.remove("hidden");
    return;
  }

  if (!data) {
    alertEl.className = "alert alert-success";
    alertEl.textContent =
      "Account created. Check your email to confirm, then sign in. For local testing, turn off Confirm email in Supabase → Authentication → Providers → Email.";
    alertEl.classList.remove("hidden");
    toast("Confirm your email to continue", "info");
    return;
  }

  toast("Account created!", "success");
  location.href = getNextUrl("portal/dashboard.html");
});
