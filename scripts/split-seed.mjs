import fs from "fs";

const full = fs.readFileSync("supabase/seed-jobs.sql", "utf8");
const statements = full
  .split(/;\s*\n(?=insert|delete)/i)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => (s.endsWith(";") ? s : s + ";"));

const batches = [];
let current = [];
let size = 0;
for (const stmt of statements) {
  if (size + stmt.length > 12000 && current.length) {
    batches.push(current.join("\n"));
    current = [];
    size = 0;
  }
  current.push(stmt);
  size += stmt.length;
}
if (current.length) batches.push(current.join("\n"));

batches.forEach((b, i) => {
  fs.writeFileSync(`supabase/seed-batch-${i}.sql`, b);
  console.log(`batch ${i}: ${b.length} chars`);
});
