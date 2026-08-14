/**
 * validate.js — lightweight form helpers
 */

export function required(value, label = "This field") {
  if (value == null || String(value).trim() === "") return `${label} is required`;
  return "";
}

export function email(value) {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
  return "";
}

export function minLength(value, n, label = "This field") {
  if (!value || String(value).length < n) return `${label} must be at least ${n} characters`;
  return "";
}

export function clearErrors(form) {
  form.querySelectorAll(".form-error").forEach((el) => el.remove());
  form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}

export function showFieldError(input, message) {
  if (!input || !message) return;
  input.classList.add("is-invalid");
  const err = document.createElement("div");
  err.className = "form-error";
  err.textContent = message;
  input.parentElement?.appendChild(err);
}

/**
 * Validate a form against a rules map: { fieldName: (value) => errorString }
 * Returns { ok, values, errors }
 */
export function validateForm(form, rules) {
  clearErrors(form);
  const data = new FormData(form);
  const values = {};
  const errors = {};
  let ok = true;
  for (const [name, rule] of Object.entries(rules)) {
    const value = data.get(name);
    values[name] = typeof value === "string" ? value.trim() : value;
    const msg = rule(values[name], values);
    if (msg) {
      ok = false;
      errors[name] = msg;
      const input = form.elements[name];
      showFieldError(input, msg);
    }
  }
  return { ok, values, errors };
}

export function parseList(text) {
  return String(text || "")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}