#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const myanmarHymns = JSON.parse(await readFile(resolve(projectRoot, "hymn_dataset/myanmar_hymns.json"), "utf8"));
const batchPath = resolve(projectRoot, process.argv[2] ?? "hymn_dataset/guitar/preparation/batch-002-020.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const errors = [];
const arrangementDirectory = resolve(projectRoot, "lib/hymns/guitar/arrangements");
const reviewedNumbers = new Set();
for (const file of await readdir(arrangementDirectory)) {
  if (!file.endsWith(".ts")) continue;
  const source = await readFile(resolve(arrangementDirectory, file), "utf8");
  const number = Number(source.match(/myanmarHymnNumber:\s*(\d+)/)?.[1]);
  if (number && /status:\s*"reviewed"/.test(source)) reviewedNumbers.add(number);
}

for (const record of batch.records ?? []) {
  const hymn = myanmarHymns.find((candidate) => candidate.number === record.myanmarNumber);
  if (!hymn) { errors.push(`MY ${record.myanmarNumber}: fabricated/missing Myanmar record`); continue; }
  const mappedEnglish = hymn.cross_references?.Eng?.trim().match(/^(\d+)(?:\(\d+\))?$/)?.[1];
  if (mappedEnglish !== String(record.englishSourceNumber)) errors.push(`MY ${record.myanmarNumber}: expected Eng ${mappedEnglish ?? "none"}, got ${record.englishSourceNumber}`);
  if (record.status === "reviewed" && !reviewedNumbers.has(record.myanmarNumber)) errors.push(`MY ${record.myanmarNumber}: reviewed without a reviewed arrangement module`);
  if (reviewedNumbers.has(record.myanmarNumber) && (record.status !== "reviewed" || !record.myanmarAnchorsPrepared)) errors.push(`MY ${record.myanmarNumber}: reviewed module not reflected in preparation status`);
  if (record.status === "needs-review" && (!record.sourceFound || !record.chordInformationFound || !record.chordsUsed?.length)) errors.push(`MY ${record.myanmarNumber}: needs-review without usable source chords`);
  if (record.status !== "reviewed" && record.myanmarAnchorsPrepared !== false) errors.push(`MY ${record.myanmarNumber}: unreviewed preparation record claims Myanmar anchors`);
}

const hymnOne = myanmarHymns.find((hymn) => hymn.number === 1);
if (hymnOne?.cross_references?.Eng?.trim() !== "1") errors.push("MY 1 no longer maps to Eng 1");
const productionIndex = await readFile(resolve(projectRoot, "lib/hymns/guitar-data.ts"), "utf8");
if (!productionIndex.includes("arrangement.status !== \"reviewed\"")) errors.push("Production lookup does not enforce reviewed status");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${batch.records.length} preparation records; only reviewed arrangements can enter production.`);
}
