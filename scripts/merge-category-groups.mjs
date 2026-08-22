import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const SOURCE = resolve(ROOT, "hymn_dataset/categories.json");
const BACKUP = resolve(ROOT, "hymn_dataset/backups/categories-before-topic-merge.json");

const stripNumber = (value) => value.replace(/^\s*\d+\.\s*/, "").trim();
const normalizeTitle = (value) => value.trim().replace(/\s+/g, " ");

const before = JSON.parse(readFileSync(SOURCE, "utf8"));
copyFileSync(SOURCE, BACKUP);

const totalHymns = (list) => list.reduce((sum, c) => sum + (c.hymns?.length ?? 0) + (c.subcategories ?? []).reduce((s, sub) => s + (sub.hymns?.length ?? 0), 0), 0);
const hymnsBefore = totalHymns(before);

const groups = new Map();
for (const category of before) {
  const key = normalizeTitle(stripNumber(category.category));
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(category);
}

const merged = [];
let combinedSubcats = 0;
for (const members of groups.values()) {
  const [base, ...rest] = members;
  for (const other of rest) {
    base.hymns = [...(base.hymns ?? []), ...(other.hymns ?? [])];
    for (const sub of other.subcategories ?? []) {
      const twin = (base.subcategories ?? []).find((candidate) => normalizeTitle(candidate.title) === normalizeTitle(sub.title));
      if (twin) {
        twin.hymns = [...(twin.hymns ?? []), ...(sub.hymns ?? [])];
        combinedSubcats++;
      } else {
        base.subcategories = [...(base.subcategories ?? []), sub];
      }
    }
    base.subcategories = (base.subcategories ?? []).map((sub, index) => ({ ...sub, slug: `topic-${String(index + 1).padStart(2, "0")}` }));
  }
  merged.push(base);
}

const hymnsAfter = totalHymns(merged);
writeFileSync(SOURCE, `${JSON.stringify(merged, null, 2)}\n`);

console.log(`cards: ${before.length} -> ${merged.length}`);
console.log(`hymn entries: ${hymnsBefore} -> ${hymnsAfter} ${hymnsBefore === hymnsAfter ? "(conserved)" : "(MISMATCH!)"}`);
console.log(`same-titled subcategories combined: ${combinedSubcats}`);
console.log(`backup written: ${BACKUP}`);
