/**
 * Show a blocking banner if the site is opened as file://
 * (ES modules and Supabase Auth will not work).
 */
export function assertHttpOrigin() {
  if (location.protocol !== "file:") return true;
  const bar = document.createElement("div");
  bar.className = "alert alert-error";
  bar.style.cssText =
    "position:sticky;top:0;z-index:9999;margin:0;border-radius:0;padding:1rem 1.25rem;text-align:center;";
  bar.innerHTML =
    "<strong>Open this site through a local server.</strong> " +
    "Do not double-click the HTML file. In the project folder run <code>npm start</code>, " +
    "then open <a href=\"http://localhost:5173/index.html\">http://localhost:5173/index.html</a>.";
  document.body.prepend(bar);
  return false;
}
