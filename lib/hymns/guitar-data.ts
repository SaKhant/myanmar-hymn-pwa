import "server-only";

import type { HymnRecord } from "./types";
import type { GuitarArrangement, GuitarSegment } from "./guitar-types";
import { hymnOneArrangement } from "./guitar/arrangements/001";

// Only reviewed modules belong in this production index. Preparation records
// under hymn_dataset/guitar are intentionally not imported into the app.
const reviewedArrangements = new Map<number, GuitarArrangement>([
  [hymnOneArrangement.myanmarHymnNumber, hymnOneArrangement],
]);

function lineText(segments: GuitarSegment[]): string {
  return segments.map((segment) => segment.text).join("");
}

function matchesLyrics(hymn: HymnRecord, arrangement: GuitarArrangement): boolean {
  const verses = hymn.sections.filter((section) => section.type === "verse");
  return arrangement.verses.every((verse) => {
    const section = verses.find((candidate) => candidate.number === verse.number);
    return section?.lines.length === verse.lines.length
      && verse.lines.every((line, index) => lineText(line.segments) === section.lines[index]);
  });
}

export function getGuitarArrangement(hymn: HymnRecord): GuitarArrangement | undefined {
  if (hymn.collection !== "myanmar_hymns" || hymn.language !== "my" || hymn.number === null) return undefined;
  const arrangement = reviewedArrangements.get(hymn.number);
  if (!arrangement || arrangement.status !== "reviewed") return undefined;

  const englishReference = hymn.cross_references.Eng?.trim().match(/^(\d+)(?:\(\d+\))?$/)?.[1];
  if (englishReference !== String(arrangement.englishSourceNumber)) return undefined;
  if (!matchesLyrics(hymn, arrangement)) return undefined;
  return arrangement;
}
