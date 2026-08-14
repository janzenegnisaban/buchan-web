/**
 * mock-db.js — localStorage engine for the BGSC prototype.
 * Collections match supabase/schema.sql so api.js can swap later.
 */

const NS = "bgsc";
const KEYS = {
  users: `${NS}.users`,
  profiles: `${NS}.profiles`,
  jobs: `${NS}.jobs`,
  applications: `${NS}.applications`,
  documents: `${NS}.documents`,
  slots: `${NS}.slots`,
  appointments: `${NS}.appointments`,
  notes: `${NS}.notes`,
  session: `${NS}.session`,
  seeded: `${NS}.seeded`,
  seedVersion: `${NS}.seedVersion`,
};

const DELAY_MS = 180;
const SEED_VERSION = "2"; // bump when seed.json jobs/company change

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowISO() {
  return new Date().toISOString();
}

function read(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function delay(ms = DELAY_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

export const db = {
  getUsers: () => read(KEYS.users),
  setUsers: (v) => write(KEYS.users, v),
  getProfiles: () => read(KEYS.profiles),
  setProfiles: (v) => write(KEYS.profiles, v),
  getJobs: () => read(KEYS.jobs),
  setJobs: (v) => write(KEYS.jobs, v),
  getApplications: () => read(KEYS.applications),
  setApplications: (v) => write(KEYS.applications, v),
  getDocuments: () => read(KEYS.documents),
  setDocuments: (v) => write(KEYS.documents, v),
  getSlots: () => read(KEYS.slots),
  setSlots: (v) => write(KEYS.slots, v),
  getAppointments: () => read(KEYS.appointments),
  setAppointments: (v) => write(KEYS.appointments, v),
  getNotes: () => read(KEYS.notes),
  setNotes: (v) => write(KEYS.notes, v),
  getSession: () => read(KEYS.session, null),
  setSession: (v) => (v ? write(KEYS.session, v) : localStorage.removeItem(KEYS.session)),
};

let seedCache = null;

export async function loadSeed() {
  if (seedCache) return seedCache;
  const res = await fetch(new URL("../../data/seed.json", import.meta.url));
  seedCache = await res.json();
  return seedCache;
}

export async function ensureSeeded() {
  const current = localStorage.getItem(KEYS.seedVersion);
  if (localStorage.getItem(KEYS.seeded) === "1" && current === SEED_VERSION) return;

  // Re-seed jobs/company when version changes; keep users/apps if already present
  const keepUsers = current && localStorage.getItem(KEYS.seeded) === "1";
  const existingUsers = keepUsers ? db.getUsers() : null;
  const existingProfiles = keepUsers ? db.getProfiles() : null;
  const existingApps = keepUsers ? db.getApplications() : null;
  const existingDocs = keepUsers ? db.getDocuments() : null;
  const existingAppts = keepUsers ? db.getAppointments() : null;
  const existingNotes = keepUsers ? db.getNotes() : null;
  const existingSlots = keepUsers ? db.getSlots() : null;

  const seed = await loadSeed();

  if (!keepUsers) {
    const adminId = uuid();
    db.setUsers([
      {
        id: adminId,
        email: seed.admin.email,
        password: seed.admin.password,
        role: "admin",
        created_at: nowISO(),
      },
    ]);
    db.setProfiles([
      {
        id: adminId,
        full_name: seed.admin.full_name,
        email: seed.admin.email,
        phone: "",
        address: "",
        education: "",
        experience: "",
        skills: "",
        role: "admin",
        created_at: nowISO(),
        updated_at: nowISO(),
      },
    ]);
    db.setApplications([]);
    db.setDocuments([]);
    db.setAppointments([]);
    db.setNotes([]);
  } else {
    db.setUsers(existingUsers);
    db.setProfiles(existingProfiles);
    db.setApplications(existingApps || []);
    db.setDocuments(existingDocs || []);
    db.setAppointments(existingAppts || []);
    db.setNotes(existingNotes || []);
  }

  const jobs = seed.jobs.map((j) => ({
    ...j,
    updated_at: j.created_at,
  }));
  db.setJobs(jobs);

  if (!existingSlots?.length) {
    const slots = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let d = 1; d <= 10; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      for (const hour of [9, 10, 11, 13, 14, 15]) {
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(day);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        slots.push({
          id: uuid(),
          starts_at: slotStart.toISOString(),
          ends_at: slotEnd.toISOString(),
          capacity: 3,
          booked_count: 0,
          created_at: nowISO(),
        });
      }
    }
    db.setSlots(slots);
  } else {
    db.setSlots(existingSlots);
  }

  localStorage.setItem(KEYS.seeded, "1");
  localStorage.setItem(KEYS.seedVersion, SEED_VERSION);
}

export function ok(data) {
  return { data, error: null };
}

export function fail(message, code = "error") {
  return { data: null, error: { message, code } };
}

export { KEYS };