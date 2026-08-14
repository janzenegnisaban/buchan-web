/**
 * auth.js — session helpers and route guards
 * Lazy-loads api.js so public pages are not blocked by Supabase client download.
 */

export async function currentUser() {
  const { api } = await import("./api.js");
  const { data } = await api.auth.getUser();
  return data;
}

/**
 * Require a logged-in user. Redirects to login if missing.
 * @param {{ role?: 'admin'|'applicant', loginPath?: string }} opts
 */
export async function requireUser(opts = {}) {
  const user = await currentUser();
  const loginPath = opts.loginPath || (opts.role === "admin" ? "../admin/login.html" : "../login.html");
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = `${loginPath}?next=${next}`;
    return null;
  }
  if (opts.role && user.role !== opts.role) {
    location.href = user.role === "admin" ? "../admin/dashboard.html" : "../portal/dashboard.html";
    return null;
  }
  return user;
}

export async function redirectIfAuthed() {
  const user = await currentUser();
  if (!user) return null;
  if (user.role === "admin") location.href = "admin/dashboard.html";
  else location.href = "portal/dashboard.html";
  return user;
}

export function getNextUrl(fallback) {
  const params = new URLSearchParams(location.search);
  return params.get("next") || fallback;
}

export async function logout(redirectTo = "../index.html") {
  const { api } = await import("./api.js");
  await api.auth.signOut();
  location.href = redirectTo;
}

/** Resolve asset/path prefixes based on page depth */
export function pathPrefix() {
  if (/\/(portal|admin)\//.test(location.pathname) || location.pathname.endsWith("/portal") || location.pathname.endsWith("/admin")) {
    return "../";
  }
  return "";
}
