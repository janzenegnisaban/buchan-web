import { api } from "../api.js";
import { requireUser } from "../auth.js";
import { renderHeader, renderFooter, renderPortalSidebar, toast } from "../ui.js";
import { validateForm, required } from "../validate.js";

const user = await requireUser({ role: "applicant", loginPath: "../login.html" });
if (!user) throw new Error("redirect");

await renderHeader();
renderFooter();
renderPortalSidebar("profile");

const form = document.getElementById("profile-form");
form.full_name.value = user.full_name || "";
form.phone.value = user.phone || "";
document.getElementById("email").value = user.email || "";
form.address.value = user.address || "";
form.education.value = user.education || "";
form.experience.value = user.experience || "";
form.skills.value = user.skills || "";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { ok, values } = validateForm(form, {
    full_name: (v) => required(v, "Full name"),
    phone: () => "",
    address: () => "",
    education: () => "",
    experience: () => "",
    skills: () => "",
  });
  if (!ok) return;
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  const { error } = await api.auth.updateProfile(values);
  btn.disabled = false;
  if (error) toast(error.message, "error");
  else toast("Profile saved", "success");
});