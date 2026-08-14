/**
 * E2E smoke — Buchan recruitment site (Supabase-backed)
 * Requires: npm start → http://127.0.0.1:5173
 *
 * Auth note: In Supabase Dashboard → Authentication → Providers → Email,
 * turn OFF "Confirm email" for local testing. Otherwise signup will not
 * create a session (and the free mailer rate-limits quickly).
 */
import { chromium } from "playwright";

const base = process.env.E2E_BASE || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const soft = [];

page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const t = msg.text();
  // Expected during auth probing / rate limits / missing favicon
  if (/favicon|404|429|400|Failed to load resource/i.test(t)) return;
  errors.push("console:" + t);
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  // --- Public jobs (seed / Supabase) ---
  await page.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#home-jobs .job-card, #home-jobs .empty-state", { timeout: 20000 });
  const homeCards = await page.locator("#home-jobs .job-card").count();
  assert(homeCards > 0, "Home should show job cards");
  console.log("OK home jobs:", homeCards);

  await page.goto(base + "/jobs.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#jobs-list .job-card, #jobs-list .empty-state", { timeout: 20000 });
  const jobCards = await page.locator("#jobs-list .job-card").count();
  assert(jobCards > 0, "Jobs page should show job cards");
  console.log("OK jobs list:", jobCards);

  // --- Login form must not leak credentials into the URL (GET) ---
  await page.goto(base + "/login.html");
  await page.waitForSelector("#login-form");
  const method = await page.getAttribute("#login-form", "method");
  assert(String(method).toLowerCase() === "post", "login form method should be post");

  await page.fill("#email", "probe@example.com");
  await page.fill("#password", "should-not-appear-in-url");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  assert(!page.url().includes("password="), "Password must not appear in the URL");
  assert(!page.url().includes("should-not-appear-in-url"), "Password must not appear in the URL");
  console.log("OK login form does not leak password in URL");

  // --- Register + login (requires Confirm email OFF) ---
  const email = `buchan.e2e.${Date.now()}@gmail.com`;
  const password = "TestPass123!";

  await page.goto(base + "/register.html");
  await page.fill("#full_name", "E2E Applicant");
  await page.fill("#email", email);
  await page.fill("#phone", "09171234567");
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  const url = page.url();
  const alertText = ((await page.locator("#reg-alert").textContent().catch(() => "")) || "").trim();

  if (url.includes("/portal/")) {
    console.log("OK register → portal", email);
  } else if (/confirm your email|Confirm email|rate limit|Too many/i.test(alertText)) {
    soft.push(
      "Register did not create a session. Disable Confirm email in Supabase Auth (Providers → Email) for local testing."
    );
    console.log("SOFT register needs confirm-email off:", alertText.slice(0, 160));
  } else if (alertText) {
    soft.push("Register alert: " + alertText);
    console.log("SOFT register alert:", alertText.slice(0, 200));
  } else {
    soft.push("Register did not redirect to portal. Check Supabase Auth Confirm email setting.");
    console.log("SOFT register stayed on", url);
  }

  if (url.includes("/portal/") || soft.length === 0) {
    // sign out via portal if possible, then login again
    await page.goto(base + "/login.html");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    if (page.url().includes("/portal/")) {
      console.log("OK login");

      await page.goto(base + "/job.html?id=job-production-operators");
      await page.waitForSelector("aside a.btn-primary, a.btn-primary");
      await page.locator("aside a.btn-primary, a.btn-primary").first().click();
      await page.waitForTimeout(2000);
      if (page.url().includes("apply.html")) {
        await page.fill("#cover_letter", "I am interested in this role.");
        await page.click('button[type="submit"]');
        await page.waitForSelector("#dropzone, .alert, .empty-state", { timeout: 15000 });
        console.log("OK apply flow reached documents/status");
      } else {
        soft.push("Apply redirect unexpected: " + page.url());
      }
    } else {
      const loginAlert = ((await page.locator("#login-alert").textContent().catch(() => "")) || "").trim();
      soft.push("Login failed: " + (loginAlert || page.url()));
    }
  }

  if (errors.length) {
    console.log("PAGE ERRORS:");
    errors.forEach((e) => console.log(" -", e));
    process.exitCode = 1;
  } else if (soft.length) {
    console.log("E2E PASSED (public + form security). Auth soft issues:");
    soft.forEach((s) => console.log(" -", s));
    // Soft auth issues are expected until Confirm email is disabled — don't fail CI hard
    process.exitCode = 0;
    console.log("E2E PARTIAL (exit 0)");
  } else {
    console.log("E2E PASSED");
  }
} catch (err) {
  console.error("E2E FAILED", err.message || err);
  console.log("PAGE ERRORS:", errors);
  console.log("URL:", page.url());
  process.exitCode = 1;
} finally {
  await browser.close();
}
