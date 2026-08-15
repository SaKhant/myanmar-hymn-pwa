import "server-only";

import type { HymnRecord } from "./types";
import type { GuitarArrangement, GuitarSegment } from "./guitar-types";
import { hymnOneArrangement } from "./guitar/arrangements/001";
import { hymnTwoArrangement } from "./guitar/arrangements/002";
import { hymnThreeArrangement } from "./guitar/arrangements/003";
import { hymnFourArrangement } from "./guitar/arrangements/004";
import { hymnFiveArrangement } from "./guitar/arrangements/005";
import { hymnSixArrangement } from "./guitar/arrangements/006";
import { hymnSevenArrangement } from "./guitar/arrangements/007";
import { hymnEightArrangement } from "./guitar/arrangements/008";
import { hymnNineArrangement } from "./guitar/arrangements/009";
import { hymnTenArrangement } from "./guitar/arrangements/010";

// Only reviewed modules belong in this production index. Preparation records
// under hymn_dataset/guitar are intentionally not imported into the app.
const reviewedArrangements = new Map<number, GuitarArrangement>([
  [hymnOneArrangement.myanmarHymnNumber, hymnOneArrangement],
  [hymnTwoArrangement.myanmarHymnNumber, hymnTwoArrangement],
  [hymnThreeArrangement.myanmarHymnNumber, hymnThreeArrangement],
  [hymnFourArrangement.myanmarHymnNumber, hymnFourArrangement],
  [hymnFiveArrangement.myanmarHymnNumber, hymnFiveArrangement],
  [hymnSixArrangement.myanmarHymnNumber, hymnSixArrangement],
  [hymnSevenArrangement.myanmarHymnNumber, hymnSevenArrangement],
  [hymnEightArrangement.myanmarHymnNumber, hymnEightArrangement],
  [hymnNineArrangement.myanmarHymnNumber, hymnNineArrangement],
  [hymnTenArrangement.myanmarHymnNumber, hymnTenArrangement],
]);

function lineText(line: GuitarArrangement["verses"][number]["lines"][number]): string {
  const phrases=line.phrases??(line.segments?[{segments:line.segments}]:[]);
  return phrases.flatMap((phrase)=>phrase.segments).map((segment: GuitarSegment) => segment.text).join("");
}

function matchesLyrics(hymn: HymnRecord, arrangement: GuitarArrangement): boolean {
  if(hymn.sections.length!==arrangement.verses.length)return false;
  return arrangement.verses.every((verse,index) => {
    const section=hymn.sections[index];
    if(section.type!==(verse.type??"verse")||section.number!==verse.number)return false;
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
