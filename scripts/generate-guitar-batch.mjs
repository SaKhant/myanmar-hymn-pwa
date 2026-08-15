#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const myanmarHymns = JSON.parse(await readFile(resolve(projectRoot, "hymn_dataset/myanmar_hymns.json"), "utf8"));
const englishHymns = JSON.parse(await readFile(resolve(projectRoot, "hymn_dataset/english_hymns.json"), "utf8"));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 20);
if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) throw new Error("Usage: node scripts/generate-guitar-batch.mjs START END");

const decode = (value) => value
  .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
  .replace(/&flat;/g, "♭").replace(/&sharp;/g, "♯").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
const stripTags = (value) => decode(value.replace(/<[^>]*>/g, "")).trim();
const detail = (html, label) => stripTags(html.match(new RegExp(`<label[^>]*>${label}:<\\/label>[\\s\\S]*?<div[^>]*no-padding[^>]*>([\\s\\S]*?)<\\/div>`, "i"))?.[1] ?? "");
const keyName = (value) => value.replace(/\s+Major$/i, "").replace(/\s+Minor$/i, "m").replace(/♭/g, "b").replace(/♯/g, "#");
const pitch = { C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11 };
const capoFor = (original, play) => {
  const originalPitch = pitch[keyName(original).replace(/m$/, "")];
  const playPitch = pitch[keyName(play).replace(/m$/, "")];
  return originalPitch === undefined || playPitch === undefined ? null : (originalPitch - playPitch + 12) % 12;
};

async function inspectSource(englishNumber) {
  const sourceUrl = `https://www.hymnal.net/en/hymn/h/${englishNumber}`;
  try {
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "Myanmar-Hymn-PWA guitar preparation" } });
    if (!response.ok) return { sourceUrl, sourceFound:false, chordInformationFound:false, reason:`Source returned HTTP ${response.status}` };
    const html = await response.text();
    const chordMatches = [...html.matchAll(/class="chord"[^>]*>([^<]+)<\/span>/g)].map((match) => stripTags(match[1]));
    const chordsUsed = [...new Set(chordMatches)].filter(Boolean);
    const originalKey = detail(html, "Key");
    const playKey = stripTags(html.match(/id="fromkeysig"[^>]*>([^<]+)</i)?.[1] ?? "") || originalKey;
    const hasChordView = chordMatches.length > 0;
    return {
      sourceUrl,
      sourceFound:true,
      chordInformationFound:hasChordView,
      originalKey:originalKey || null,
      suggestedPlayKey:playKey ? keyName(playKey) : null,
      capo:capoFor(originalKey, playKey),
      timeSignature:detail(html, "Time") || null,
      meter:detail(html, "Meter") || null,
      chordsUsed,
      sourceChordEventCount:chordMatches.length,
      reason:hasChordView ? "Source chords found; Myanmar syllable anchors require manual review." : "No source chord markup was found.",
    };
  } catch (error) {
    return { sourceUrl, sourceFound:false, chordInformationFound:false, reason:error instanceof Error ? error.message : String(error) };
  }
}

const records = [];
for (let number = start; number <= end; number += 1) {
  const myanmar = myanmarHymns.find((hymn) => hymn.number === number);
  if (!myanmar) continue;
  const rawReference = myanmar.cross_references?.Eng?.trim() ?? "";
  const englishSourceNumber = Number(rawReference.match(/^(\d+)(?:\(\d+\))?$/)?.[1]);
  if (!englishSourceNumber) {
    records.push({ myanmarNumber:number, myanmarTitle:myanmar.title, englishReference:rawReference || null, englishSourceNumber:null, englishRecordFound:false, sourceFound:false, chordInformationFound:false, status:"unavailable", reason:"Missing or ambiguous English cross-reference." });
    continue;
  }
  const englishRecordFound = englishHymns.some((hymn) => hymn.number === englishSourceNumber);
  const source = await inspectSource(englishSourceNumber);
  records.push({
    myanmarNumber:number,
    myanmarTitle:myanmar.title,
    englishReference:rawReference,
    englishSourceNumber,
    englishRecordFound,
    ...source,
    structure:myanmar.sections.map((section) => ({ type:section.type, number:section.number, lineCount:section.lines.length })),
    myanmarAnchorsPrepared:false,
    status:source.sourceFound && source.chordInformationFound ? "needs-review" : "unavailable",
  });
}

const output = {
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  range:{ start, end },
  policy:{ productionRequiresStatus:"reviewed", generatedDefaultStatus:"needs-review", anchorMethod:"explicit Myanmar text segments" },
  records,
};
const outputPath = resolve(projectRoot, `hymn_dataset/guitar/preparation/batch-${String(start).padStart(3,"0")}-${String(end).padStart(3,"0")}.json`);
await mkdir(dirname(outputPath), { recursive:true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const reportPath = outputPath.replace(/\.json$/, ".md");
const cell = (value) => String(value ?? "—").replace(/\|/g, "\\|");
const reportLines = [
  `# Guitar preparation batch ${start}–${end}`,
  "",
  `Generated from ${records.length} real Myanmar records. Only \`reviewed\` arrangements are production-visible; this report is development-only.`,
  "",
  "| MY | Myanmar title | ENG source | Source | Chords | Original key | Play | Capo | Chord set | Status | Reason |",
  "|---:|---|---:|:---:|:---:|---|---|---:|---|---|---|",
  ...records.map((record) => `| ${record.myanmarNumber} | ${cell(record.myanmarTitle)} | ${record.sourceUrl ? `[${cell(record.englishSourceNumber)}](${record.sourceUrl})` : cell(record.englishSourceNumber)} | ${record.sourceFound ? "yes" : "no"} | ${record.chordInformationFound ? "yes" : "no"} | ${cell(record.originalKey)} | ${cell(record.suggestedPlayKey)} | ${cell(record.capo)} | ${cell(record.chordsUsed?.join(", "))} | ${record.status} | ${cell(record.reason)} |`),
  "",
  "No Myanmar anchors are generated by this step. Chord sequences must be aligned to explicit Myanmar sung-syllable segments during manual review.",
  "",
];
await writeFile(reportPath, reportLines.join("\n"), "utf8");
console.log(`Wrote ${records.length} real Myanmar records to ${outputPath} and ${reportPath}`);
