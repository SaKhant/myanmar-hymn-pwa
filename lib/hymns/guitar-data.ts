import "server-only";

import type { HymnRecord } from "./types";
import type { GuitarArrangement, GuitarSegment } from "./guitar-types";
import { hymnOneArrangement } from "./guitar/arrangements/001";
import { hymnTwoArrangement } from "./guitar/arrangements/002";
import { hymnThreeArrangement } from "./guitar/arrangements/003";
import { hymnFourArrangement } from "./guitar/arrangements/004";
import { hymnFiveArrangement } from "./guitar/arrangements/005";

// Only reviewed modules belong in this production index. Preparation records
// under hymn_dataset/guitar are intentionally not imported into the app.
const reviewedArrangements = new Map<number, GuitarArrangement>([
  [hymnOneArrangement.myanmarHymnNumber, hymnOneArrangement],
  [hymnTwoArrangement.myanmarHymnNumber, hymnTwoArrangement],
  [hymnThreeArrangement.myanmarHymnNumber, hymnThreeArrangement],
  [hymnFourArrangement.myanmarHymnNumber, hymnFourArrangement],
  [hymnFiveArrangement.myanmarHymnNumber, hymnFiveArrangement],
]);

function lineText(line: GuitarArrangement["verses"][number]["lines"][number]): string {
  const phrases=line.phrases??(line.segments?[{segments:line.segments}]:[]);
  return phrases.flatMap((phrase)=>phrase.segments).map((segment: GuitarSegment) => segment.text).join("");
}

function matchesLyrics(hymn: HymnRecord, arrangement: GuitarArrangement): boolean {
  const verses = hymn.sections.filter((section) => section.type === "verse");
  return arrangement.verses.every((verse) => {
    const section = verses.find((candidate) => candidate.number === verse.number);
    return section?.lines.length === verse.lines.length
      && verse.lines.every((line, index) => lineText(line) === section.lines[index]);
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
