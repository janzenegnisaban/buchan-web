/**
 * Classic (non-module) public job loader.
 * Works even when ES modules / Supabase JS fail.
 * Prefer Supabase REST; fall back to /data/seed.json.
 */
(function () {
  var SUPABASE_URL = "https://jmsvobftkciahkldjncf.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptc3ZvYmZ0a2NpYWhrbGRqbmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDk5MDMsImV4cCI6MjEwMjIyNTkwM30.JfsJVczDTclkuiI53hN06pOVrlfwk6YCkVm763QOLLk";

  var covers = {
    "job-barista-subic": "barista.jpg",
    "job-barista-clark": "barista.jpg",
    "job-service-crew-clark": "service.jpg",
    "job-service-crew-subic": "service.jpg",
    "job-production-operators": "production.jpg",
    "job-skilled-sewer": "sewing.jpg",
    "job-hr-coordinator": "hr.jpg",
    "job-qc-support": "docs.jpg",
    "job-materials-control": "warehouse.jpg",
    "job-engineering-support": "engineering.jpg",
    "job-kitchen-staff": "kitchen.jpg",
    "job-line-cook": "kitchen.jpg",
    "job-utility": "safety.jpg",
    "job-driver": "warehouse.jpg",
    "job-janitor": "safety.jpg",
    "job-junior-hairstylist": "interview.jpg",
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function card(job) {
    var img = covers[job.id] || "docs.jpg";
    var urgent = job.urgent ? '<span class="badge badge-urgent">Urgent</span>' : "";
    var snippet = (job.description || "").slice(0, 100);
    var more = (job.description || "").length > 100 ? "…" : "";
    return (
      '<article class="card card-hover job-card">' +
      '<div class="job-cover">' +
      '<img src="assets/img/jobs/' +
      img +
      '" alt="' +
      esc(job.title) +
      '" loading="lazy" />' +
      '<div class="cover-badges">' +
      urgent +
      '<span class="chip chip-open">Open</span></div></div>' +
      '<div class="card-body">' +
      '<span class="badge">' +
      esc(job.category || "") +
      "</span>" +
      '<h3 class="card-title">' +
      esc(job.title) +
      "</h3>" +
      '<p class="card-meta">' +
      esc(job.location || "—") +
      " · " +
      esc(job.employment_type || "") +
      "</p>" +
      '<p class="text-muted mb-0">' +
      esc(snippet) +
      more +
      "</p></div>" +
      '<div class="card-actions">' +
      '<a class="btn btn-primary btn-sm" href="job.html?id=' +
      encodeURIComponent(job.id) +
      '">Apply now</a></div></article>'
    );
  }

  function show(el, jobs, limit) {
    if (!el) return;
    if (!jobs || !jobs.length) {
      el.innerHTML =
        '<div class="empty-state"><h3>No openings yet</h3><p>Check back soon or contact our office.</p></div>';
      return;
    }
    var list = limit ? jobs.slice(0, limit) : jobs;
    el.innerHTML = list.map(card).join("");
    el.setAttribute("data-jobs-loaded", "1");
  }

  function showError(el, msg) {
    if (!el || el.getAttribute("data-jobs-loaded") === "1") return;
    el.innerHTML =
      '<div class="empty-state"><h3>Unable to load jobs</h3><p>' +
      esc(msg) +
      "</p></div>";
  }

  function fetchWithTimeout(url, options, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () {
      ctrl.abort();
    }, ms);
    return fetch(url, Object.assign({}, options || {}, { signal: ctrl.signal })).finally(function () {
      clearTimeout(t);
    });
  }

  function fromSupabase() {
    var url =
      SUPABASE_URL +
      "/rest/v1/jobs?select=*&order=created_at.desc&status=eq.open";
    return fetchWithTimeout(
      url,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          Accept: "application/json",
        },
      },
      7000
    ).then(function (res) {
      if (!res.ok) throw new Error("Supabase " + res.status);
      return res.json();
    });
  }

  function fromSeed() {
    return fetchWithTimeout("data/seed.json", { headers: { Accept: "application/json" } }, 7000).then(
      function (res) {
        if (!res.ok) throw new Error("seed.json " + res.status);
        return res.json();
      }
    ).then(function (seed) {
      return (seed.jobs || []).filter(function (j) {
        return !j.status || j.status === "open";
      });
    });
  }

  function fillCategories(jobs) {
    var sel = document.getElementById("category");
    if (!sel || sel.options.length > 1) return;
    var seen = {};
    jobs.forEach(function (j) {
      if (!j.category || seen[j.category]) return;
      seen[j.category] = 1;
      var opt = document.createElement("option");
      opt.value = j.category;
      opt.textContent = j.category;
      sel.appendChild(opt);
    });
  }

  function boot() {
    var home = document.getElementById("home-jobs");
    var list = document.getElementById("jobs-list");
    var target = list || home;
    if (!target) return;

    function apply(jobs) {
      if (home) show(home, jobs, 8);
      if (list) {
        show(list, jobs);
        fillCategories(jobs);
        window.__bgscAllJobs = jobs;
      }
    }

    // Same-origin seed first (instant), then refresh from Supabase
    fromSeed()
      .then(function (jobs) {
        apply(jobs);
      })
      .catch(function () {
        /* wait for supabase */
      });

    fromSupabase()
      .then(function (jobs) {
        apply(jobs);
      })
      .catch(function (err) {
        console.warn("Supabase jobs failed", err);
        if (target.getAttribute("data-jobs-loaded") !== "1") {
          fromSeed()
            .then(apply)
            .catch(function (e2) {
              showError(target, e2.message || String(e2));
            });
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Optional filters on jobs.html
  window.__bgscReloadJobs = function () {
    var list = document.getElementById("jobs-list");
    if (!list || !window.__bgscAllJobs) return;
    var q = (document.getElementById("q") && document.getElementById("q").value) || "";
    var cat = (document.getElementById("category") && document.getElementById("category").value) || "";
    var type =
      (document.getElementById("employment_type") && document.getElementById("employment_type").value) || "";
    var loc = (document.getElementById("location") && document.getElementById("location").value) || "";
    q = q.trim().toLowerCase();
    loc = loc.trim().toLowerCase();
    var filtered = window.__bgscAllJobs.filter(function (j) {
      if (cat && j.category !== cat) return false;
      if (type && j.employment_type !== type) return false;
      if (loc && String(j.location || "").toLowerCase().indexOf(loc) === -1) return false;
      if (q) {
        var blob = (j.title + " " + (j.description || "") + " " + (j.category || "")).toLowerCase();
        if (blob.indexOf(q) === -1) return false;
      }
      return true;
    });
    show(list, filtered);
  };
})();
