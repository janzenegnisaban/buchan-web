/**
 * api.js — Supabase-backed data layer for BGSC recruitment site.
 * Keep this export shape stable; pages import only from here.
 */

import { supabase } from "./supabase-client.js";

function ok(data) {
  return { data, error: null };
}

function fail(message, code = "error") {
  return { data: null, error: { message, code } };
}

function fromSb(error) {
  return fail(error?.message || "Request failed", error?.code || "error");
}

function slugify(text) {
  return String(text || "job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function dataUrlToBlob(dataUrl) {
  const [header, body] = String(dataUrl).split(",");
  const mime = (header.match(/:(.*?);/) || [])[1] || "application/octet-stream";
  const binary = atob(body || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function currentProfile() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return { user: null, profile: null, error };
  if (!user) return { user: null, profile: null, error: null };
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (pErr) return { user, profile: null, error: pErr };
  return {
    user,
    profile: profile
      ? {
          id: user.id,
          email: profile.email || user.email,
          role: profile.role || "applicant",
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          address: profile.address || "",
          education: profile.education || "",
          experience: profile.experience || "",
          skills: profile.skills || "",
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }
      : {
          id: user.id,
          email: user.email,
          role: "applicant",
          full_name: user.user_metadata?.full_name || "",
        },
    error: null,
  };
}

async function requireAuth() {
  const { profile, error } = await currentProfile();
  if (error) return { user: null, err: fromSb(error) };
  if (!profile) return { user: null, err: fail("Not authenticated", "auth") };
  return { user: profile, err: null };
}

async function requireAdmin() {
  const { user, err } = await requireAuth();
  if (err) return { user: null, err };
  if (user.role !== "admin") return { user: null, err: fail("Admin only", "forbidden") };
  return { user, err: null };
}

/* ---------- Auth ---------- */
async function signUp({ email, password, full_name, phone }) {
  email = (email || "").trim().toLowerCase();
  if (!email || !password || !full_name) {
    return fail("Full name, email, and password are required");
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone: phone || "" },
      emailRedirectTo: `${location.origin}/login.html`,
    },
  });
  if (error) {
    const msg = error.message || "Sign up failed";
    if (/rate limit/i.test(msg)) {
      return fail(
        "Too many signup emails sent. Wait a minute, or disable Confirm email in Supabase Auth settings for testing."
      );
    }
    return fromSb(error);
  }
  if (!data.user) return fail("Sign up failed");

  // Email confirmation enabled → no session until user confirms
  if (!data.session) {
    return ok(null);
  }

  await new Promise((r) => setTimeout(r, 400));
  const { profile } = await currentProfile();
  return ok(profile);
}

async function signIn({ email, password }) {
  email = (email || "").trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message || "";
    if (/confirm|not confirmed/i.test(msg)) {
      return fail("Please confirm your email before signing in.", "auth");
    }
    if (/invalid/i.test(msg)) {
      return fail("Invalid email or password", "auth");
    }
    return fail(msg || "Invalid email or password", "auth");
  }
  if (!data.session) {
    return fail("Please confirm your email before signing in.", "auth");
  }
  const { profile } = await currentProfile();
  return ok(profile);
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) return fromSb(error);
  return ok(true);
}

async function getUser() {
  try {
    const result = await Promise.race([
      currentProfile(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 8000)),
    ]);
    if (result.error) return fromSb(result.error);
    return ok(result.profile);
  } catch {
    return ok(null);
  }
}

function onChange(cb) {
  const { data } = supabase.auth.onAuthStateChange(async () => {
    const { profile } = await currentProfile();
    cb(profile);
  });
  return () => data.subscription.unsubscribe();
}

async function updateProfile(fields) {
  const { user, err } = await requireAuth();
  if (err) return err;
  const allowed = {
    full_name: fields.full_name,
    phone: fields.phone,
    address: fields.address,
    education: fields.education,
    experience: fields.experience,
    skills: fields.skills,
  };
  Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) return fromSb(error);
  return ok({ ...data, role: data.role, email: data.email });
}

/* ---------- Jobs ---------- */
async function listJobs({ status, search, category, location, employment_type } = {}) {
  let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (category) q = q.eq("category", category);
  if (employment_type) q = q.eq("employment_type", employment_type);
  if (location) q = q.ilike("location", `%${location}%`);
  if (search) {
    const s = search.replace(/%/g, "");
    q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) return fromSb(error);
  return ok(data || []);
}

async function getJob(id) {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) return fromSb(error);
  if (!data) return fail("Job not found", "not_found");
  return ok(data);
}

async function createJob(payload) {
  const { err } = await requireAdmin();
  if (err) return err;
  const id = payload.id || `job-${slugify(payload.title)}-${Date.now().toString(36)}`;
  const row = {
    id,
    title: payload.title,
    category: payload.category || "General",
    location: payload.location || "",
    branch: payload.branch || "",
    employment_type: payload.employment_type || "Contractual",
    status: payload.status || "open",
    salary_range: payload.salary_range || "",
    description: payload.description || "",
    qualifications: payload.qualifications || [],
    requirements: payload.requirements || [],
    urgent: !!payload.urgent,
  };
  const { data, error } = await supabase.from("jobs").insert(row).select("*").single();
  if (error) return fromSb(error);
  return ok(data);
}

async function updateJob(id, payload) {
  const { err } = await requireAdmin();
  if (err) return err;
  const { id: _ignore, ...rest } = payload || {};
  const { data, error } = await supabase
    .from("jobs")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fromSb(error);
  return ok(data);
}

async function closeJob(id) {
  return updateJob(id, { status: "closed" });
}

async function removeJob(id) {
  const { err } = await requireAdmin();
  if (err) return err;
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) return fromSb(error);
  return ok(true);
}

/* ---------- Applications ---------- */
async function enrichApplication(app) {
  if (!app) return null;
  const [{ data: job }, { data: applicant }, { data: documents }, { data: notes }, { data: appointments }] =
    await Promise.all([
      supabase.from("jobs").select("*").eq("id", app.job_id).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", app.applicant_id).maybeSingle(),
      supabase.from("documents").select("*").eq("application_id", app.id).order("created_at"),
      supabase.from("application_notes").select("*").eq("application_id", app.id).order("created_at"),
      supabase
        .from("appointments")
        .select("*")
        .eq("application_id", app.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
  return {
    ...app,
    job: job || null,
    applicant: applicant || null,
    documents: documents || [],
    notes: notes || [],
    appointment: appointments?.[0] || null,
  };
}

async function createApplication({ job_id, cover_letter }) {
  const { user, err } = await requireAuth();
  if (err) return err;
  if (user.role !== "applicant") return fail("Only applicants can apply");

  const { data: job } = await supabase.from("jobs").select("id,status").eq("id", job_id).maybeSingle();
  if (!job || job.status !== "open") return fail("Job is not open for applications");

  const { data: app, error } = await supabase
    .from("applications")
    .insert({
      job_id,
      applicant_id: user.id,
      status: "submitted",
      cover_letter: cover_letter || "",
    })
    .select("*")
    .single();
  if (error) {
    if (String(error.message || "").includes("duplicate") || error.code === "23505") {
      return fail("You already applied to this job");
    }
    return fromSb(error);
  }

  await supabase.from("application_notes").insert({
    application_id: app.id,
    author_id: user.id,
    body: "Application submitted",
    is_system: true,
  });

  return ok(app);
}

async function listMineApplications() {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return fromSb(error);
  const enriched = await Promise.all((data || []).map(enrichApplication));
  return ok(enriched);
}

async function listAllApplications({ status, job_id, search } = {}) {
  const { err } = await requireAdmin();
  if (err) return err;
  let q = supabase.from("applications").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (job_id) q = q.eq("job_id", job_id);
  const { data, error } = await q;
  if (error) return fromSb(error);
  let enriched = await Promise.all((data || []).map(enrichApplication));
  if (search) {
    const s = search.toLowerCase();
    enriched = enriched.filter(
      (a) =>
        (a.applicant?.full_name || "").toLowerCase().includes(s) ||
        (a.applicant?.email || "").toLowerCase().includes(s) ||
        (a.job?.title || "").toLowerCase().includes(s)
    );
  }
  return ok(enriched);
}

async function getApplication(id) {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (error) return fromSb(error);
  if (!data) return fail("Application not found", "not_found");
  if (user.role !== "admin" && data.applicant_id !== user.id) return fail("Forbidden", "forbidden");
  return ok(await enrichApplication(data));
}

async function setApplicationStatus(id, status, reason = "") {
  const { user, err } = await requireAdmin();
  if (err) return err;
  const { data, error } = await supabase
    .from("applications")
    .update({
      status,
      status_reason: reason || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fromSb(error);
  await supabase.from("application_notes").insert({
    application_id: id,
    author_id: user.id,
    body: `Status changed to ${status}${reason ? `: ${reason}` : ""}`,
    is_system: true,
  });
  return ok(await enrichApplication(data));
}

async function addApplicationNote(id, body) {
  const { user, err } = await requireAdmin();
  if (err) return err;
  if (!body?.trim()) return fail("Note cannot be empty");
  const { data, error } = await supabase
    .from("application_notes")
    .insert({
      application_id: id,
      author_id: user.id,
      body: body.trim(),
      is_system: false,
    })
    .select("*")
    .single();
  if (error) return fromSb(error);
  return ok(data);
}

/* ---------- Documents ---------- */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function uploadDocument({ application_id, doc_type, file_name, mime_type, data_url, size }) {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data: app } = await supabase.from("applications").select("*").eq("id", application_id).maybeSingle();
  if (!app) return fail("Application not found");
  if (user.role !== "admin" && app.applicant_id !== user.id) return fail("Forbidden", "forbidden");
  if (size > MAX_UPLOAD_BYTES) {
    return fail(`File too large. Max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)}MB.`);
  }

  const path = `${app.applicant_id}/${application_id}/${doc_type}_${Date.now()}_${file_name}`;
  const blob = dataUrlToBlob(data_url);
  const { error: upErr } = await supabase.storage.from("applicant-documents").upload(path, blob, {
    contentType: mime_type || blob.type,
    upsert: true,
  });
  if (upErr) return fromSb(upErr);

  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("application_id", application_id)
    .eq("doc_type", doc_type)
    .maybeSingle();

  let doc;
  if (existing?.id) {
    const { data, error } = await supabase
      .from("documents")
      .update({
        file_name,
        mime_type,
        storage_path: path,
        size,
        status: "uploaded",
        review_note: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return fromSb(error);
    doc = data;
  } else {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        application_id,
        applicant_id: app.applicant_id,
        doc_type,
        file_name,
        mime_type,
        storage_path: path,
        size,
        status: "uploaded",
      })
      .select("*")
      .single();
    if (error) return fromSb(error);
    doc = data;
  }

  if (app.status === "submitted") {
    await supabase
      .from("applications")
      .update({ status: "under_review", updated_at: new Date().toISOString() })
      .eq("id", application_id);
  }

  return ok({ ...doc, storage_path: "[stored]" });
}

async function listDocumentsFor(application_id) {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data: app } = await supabase.from("applications").select("*").eq("id", application_id).maybeSingle();
  if (!app) return fail("Application not found");
  if (user.role !== "admin" && app.applicant_id !== user.id) return fail("Forbidden", "forbidden");
  const { data, error } = await supabase.from("documents").select("*").eq("application_id", application_id);
  if (error) return fromSb(error);
  return ok(data || []);
}

async function removeDocument(id) {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data: doc } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) return fail("Document not found");
  if (user.role !== "admin" && doc.applicant_id !== user.id) return fail("Forbidden", "forbidden");
  await supabase.storage.from("applicant-documents").remove([doc.storage_path]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return fromSb(error);
  return ok(true);
}

async function getDocumentUrl(id) {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data: doc } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) return fail("Document not found");
  if (user.role !== "admin" && doc.applicant_id !== user.id) return fail("Forbidden", "forbidden");
  const { data, error } = await supabase.storage
    .from("applicant-documents")
    .createSignedUrl(doc.storage_path, 60 * 10);
  if (error) return fromSb(error);
  return ok({ url: data.signedUrl, mime_type: doc.mime_type, file_name: doc.file_name });
}

async function setDocumentStatus(id, status, review_note = "") {
  const { err } = await requireAdmin();
  if (err) return err;
  const { data, error } = await supabase
    .from("documents")
    .update({ status, review_note, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fromSb(error);
  return ok({ ...data, storage_path: "[stored]" });
}

/* ---------- Slots ---------- */
async function listOpenSlots() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("interview_slots")
    .select("*")
    .gt("starts_at", now)
    .order("starts_at");
  if (error) return fromSb(error);
  return ok((data || []).filter((s) => s.booked_count < s.capacity));
}

async function listAllSlots() {
  const { err } = await requireAdmin();
  if (err) return err;
  const { data, error } = await supabase.from("interview_slots").select("*").order("starts_at");
  if (error) return fromSb(error);
  return ok(data || []);
}

async function createSlot({ starts_at, ends_at, capacity }) {
  const { err } = await requireAdmin();
  if (err) return err;
  const { data, error } = await supabase
    .from("interview_slots")
    .insert({
      starts_at,
      ends_at,
      capacity: Number(capacity) || 1,
      booked_count: 0,
    })
    .select("*")
    .single();
  if (error) return fromSb(error);
  return ok(data);
}

async function createSlotsBulk(slotList) {
  const { err } = await requireAdmin();
  if (err) return err;
  const rows = (slotList || []).map((s) => ({
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    capacity: Number(s.capacity) || 1,
    booked_count: 0,
  }));
  const { data, error } = await supabase.from("interview_slots").insert(rows).select("*");
  if (error) return fromSb(error);
  return ok(data || []);
}

async function removeSlot(id) {
  const { err } = await requireAdmin();
  if (err) return err;
  const { data: slot } = await supabase.from("interview_slots").select("*").eq("id", id).maybeSingle();
  if (!slot) return fail("Slot not found");
  if (slot.booked_count > 0) return fail("Cannot delete a slot with bookings");
  const { error } = await supabase.from("interview_slots").delete().eq("id", id);
  if (error) return fromSb(error);
  return ok(true);
}

/* ---------- Appointments ---------- */
async function bookAppointment({ application_id, slot_id }) {
  const { err } = await requireAuth();
  if (err) return err;
  const { data, error } = await supabase.rpc("book_interview", {
    p_application_id: application_id,
    p_slot_id: slot_id,
  });
  if (error) return fromSb(error);
  return ok(data);
}

async function cancelAppointment(id) {
  const { err } = await requireAuth();
  if (err) return err;
  const { error } = await supabase.rpc("cancel_interview", { p_appointment_id: id });
  if (error) return fromSb(error);
  return ok(true);
}

async function listMineAppointments() {
  const { user, err } = await requireAuth();
  if (err) return err;
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("applicant_id", user.id)
    .order("starts_at", { ascending: false });
  if (error) return fromSb(error);
  return ok(data || []);
}

async function listAllAppointments() {
  const { err } = await requireAdmin();
  if (err) return err;
  const { data, error } = await supabase.from("appointments").select("*").order("starts_at");
  if (error) return fromSb(error);
  const list = [];
  for (const a of data || []) {
    const [{ data: profile }, { data: app }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", a.applicant_id).maybeSingle(),
      supabase.from("applications").select("*").eq("id", a.application_id).maybeSingle(),
    ]);
    let job = null;
    if (app?.job_id) {
      const { data: j } = await supabase.from("jobs").select("*").eq("id", app.job_id).maybeSingle();
      job = j;
    }
    list.push({ ...a, applicant: profile, job, application: app });
  }
  return ok(list);
}

async function setAppointmentOutcome(id, { status, outcome }) {
  const { user, err } = await requireAdmin();
  if (err) return err;
  const { data: appt, error } = await supabase
    .from("appointments")
    .update({
      status: status || undefined,
      outcome: outcome || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fromSb(error);

  if (outcome === "hired" || outcome === "talent_pool" || outcome === "interviewed" || status === "no_show") {
    let next = "interviewed";
    if (outcome === "hired") next = "hired";
    else if (outcome === "talent_pool") next = "talent_pool";
    else if (status === "no_show") next = "qualified";
    await supabase
      .from("applications")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", appt.application_id);
  }

  await supabase.from("application_notes").insert({
    application_id: appt.application_id,
    author_id: user.id,
    body: `Appointment ${status || "updated"}${outcome ? ` — ${outcome}` : ""}`,
    is_system: true,
  });

  return ok(appt);
}

/* ---------- Meta ---------- */
async function getDocumentTypes() {
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "document_types").maybeSingle();
  if (error) return fromSb(error);
  return ok(data?.value || []);
}

async function getCompany() {
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "company").maybeSingle();
  if (error) return fromSb(error);
  return ok(data?.value || null);
}

async function getAdminStats() {
  const { err } = await requireAdmin();
  if (err) return err;
  const [{ data: apps }, { data: jobs }, { data: appts }] = await Promise.all([
    supabase.from("applications").select("id,status"),
    supabase.from("jobs").select("id,status"),
    supabase.from("appointments").select("id,status,starts_at").eq("status", "scheduled"),
  ]);
  const now = Date.now();
  const applicationRows = apps || [];
  return ok({
    new_applications: applicationRows.filter((a) => a.status === "submitted" || a.status === "under_review").length,
    pending_review: applicationRows.filter((a) => a.status === "under_review" || a.status === "submitted").length,
    upcoming_interviews: (appts || []).filter((a) => new Date(a.starts_at).getTime() >= now).length,
    open_jobs: (jobs || []).filter((j) => j.status === "open").length,
    total_applicants: applicationRows.length,
  });
}

export const api = {
  auth: { signUp, signIn, signOut, getUser, onChange, updateProfile },
  jobs: { list: listJobs, get: getJob, create: createJob, update: updateJob, close: closeJob, remove: removeJob },
  applications: {
    create: createApplication,
    listMine: listMineApplications,
    listAll: listAllApplications,
    get: getApplication,
    setStatus: setApplicationStatus,
    addNote: addApplicationNote,
  },
  documents: {
    upload: uploadDocument,
    listFor: listDocumentsFor,
    remove: removeDocument,
    getUrl: getDocumentUrl,
    setStatus: setDocumentStatus,
  },
  slots: {
    listOpen: listOpenSlots,
    listAll: listAllSlots,
    create: createSlot,
    createBulk: createSlotsBulk,
    remove: removeSlot,
  },
  appointments: {
    book: bookAppointment,
    cancel: cancelAppointment,
    listMine: listMineAppointments,
    listAll: listAllAppointments,
    setOutcome: setAppointmentOutcome,
  },
  meta: { getDocumentTypes, getCompany, getAdminStats },
};
