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
import { hymnElevenArrangement } from "./guitar/arrangements/011";
import { hymnTwelveArrangement } from "./guitar/arrangements/012";
import { hymnThirteenArrangement } from "./guitar/arrangements/013";
import { hymnFourteenArrangement } from "./guitar/arrangements/014";
import { hymnFifteenArrangement } from "./guitar/arrangements/015";
import { hymnSixteenArrangement } from "./guitar/arrangements/016";
import { hymnSeventeenArrangement } from "./guitar/arrangements/017";
import { hymnEighteenArrangement } from "./guitar/arrangements/018";
import { hymnNineteenArrangement } from "./guitar/arrangements/019";
import { hymnTwentyArrangement } from "./guitar/arrangements/020";
import { hymnTwentyOneArrangement } from "./guitar/arrangements/021";
import { hymnTwentyTwoArrangement } from "./guitar/arrangements/022";
import { hymnTwentyThreeArrangement } from "./guitar/arrangements/023";
import { hymnTwentyFourArrangement } from "./guitar/arrangements/024";
import { hymnTwentyFiveArrangement } from "./guitar/arrangements/025";
import { hymnTwentySixArrangement } from "./guitar/arrangements/026";
import { hymnTwentySevenArrangement } from "./guitar/arrangements/027";
import { hymnTwentyEightArrangement } from "./guitar/arrangements/028";
import { hymnTwentyNineArrangement } from "./guitar/arrangements/029";
import { hymnThirtyArrangement } from "./guitar/arrangements/030";
import { hymnThirtyOneArrangement } from "./guitar/arrangements/031";
import { hymnThirtyTwoArrangement } from "./guitar/arrangements/032";
import { hymnThirtyThreeArrangement } from "./guitar/arrangements/033";
import { hymnThirtyFourArrangement } from "./guitar/arrangements/034";
import { hymnThirtyFiveArrangement } from "./guitar/arrangements/035";
import { hymnThirtySixArrangement } from "./guitar/arrangements/036";
import { hymnThirtySevenArrangement } from "./guitar/arrangements/037";
import { hymnThirtyEightArrangement } from "./guitar/arrangements/038";
import { hymnThirtyNineArrangement } from "./guitar/arrangements/039";
import { hymnFortyArrangement } from "./guitar/arrangements/040";
import { hymnFortyOneArrangement } from "./guitar/arrangements/041";
import { hymnFortyTwoArrangement } from "./guitar/arrangements/042";
import { hymnFortyThreeArrangement } from "./guitar/arrangements/043";
import { hymnFortyFourArrangement } from "./guitar/arrangements/044";
import { hymnFortyFiveArrangement } from "./guitar/arrangements/045";
import { hymnFortySixArrangement } from "./guitar/arrangements/046";
import { hymnFortySevenArrangement } from "./guitar/arrangements/047";
import { hymnFortyEightArrangement } from "./guitar/arrangements/048";
import { hymnFortyNineArrangement } from "./guitar/arrangements/049";
import { hymnFiftyArrangement } from "./guitar/arrangements/050";

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
  [hymnElevenArrangement.myanmarHymnNumber, hymnElevenArrangement],
  [hymnTwelveArrangement.myanmarHymnNumber, hymnTwelveArrangement],
  [hymnThirteenArrangement.myanmarHymnNumber, hymnThirteenArrangement],
  [hymnFourteenArrangement.myanmarHymnNumber, hymnFourteenArrangement],
  [hymnFifteenArrangement.myanmarHymnNumber, hymnFifteenArrangement],
  [hymnSixteenArrangement.myanmarHymnNumber, hymnSixteenArrangement],
  [hymnSeventeenArrangement.myanmarHymnNumber, hymnSeventeenArrangement],
  [hymnEighteenArrangement.myanmarHymnNumber, hymnEighteenArrangement],
  [hymnNineteenArrangement.myanmarHymnNumber, hymnNineteenArrangement],
  [hymnTwentyArrangement.myanmarHymnNumber, hymnTwentyArrangement],
  [hymnTwentyOneArrangement.myanmarHymnNumber, hymnTwentyOneArrangement],
  [hymnTwentyTwoArrangement.myanmarHymnNumber, hymnTwentyTwoArrangement],
  [hymnTwentyThreeArrangement.myanmarHymnNumber, hymnTwentyThreeArrangement],
  [hymnTwentyFourArrangement.myanmarHymnNumber, hymnTwentyFourArrangement],
  [hymnTwentyFiveArrangement.myanmarHymnNumber, hymnTwentyFiveArrangement],
  [hymnTwentySixArrangement.myanmarHymnNumber, hymnTwentySixArrangement],
  [hymnTwentySevenArrangement.myanmarHymnNumber, hymnTwentySevenArrangement],
  [hymnTwentyEightArrangement.myanmarHymnNumber, hymnTwentyEightArrangement],
  [hymnTwentyNineArrangement.myanmarHymnNumber, hymnTwentyNineArrangement],
  [hymnThirtyArrangement.myanmarHymnNumber, hymnThirtyArrangement],
  [hymnThirtyOneArrangement.myanmarHymnNumber, hymnThirtyOneArrangement],
  [hymnThirtyTwoArrangement.myanmarHymnNumber, hymnThirtyTwoArrangement],
  [hymnThirtyThreeArrangement.myanmarHymnNumber, hymnThirtyThreeArrangement],
  [hymnThirtyFourArrangement.myanmarHymnNumber, hymnThirtyFourArrangement],
  [hymnThirtyFiveArrangement.myanmarHymnNumber, hymnThirtyFiveArrangement],
  [hymnThirtySixArrangement.myanmarHymnNumber, hymnThirtySixArrangement],
  [hymnThirtySevenArrangement.myanmarHymnNumber, hymnThirtySevenArrangement],
  [hymnThirtyEightArrangement.myanmarHymnNumber, hymnThirtyEightArrangement],
  [hymnThirtyNineArrangement.myanmarHymnNumber, hymnThirtyNineArrangement],
  [hymnFortyArrangement.myanmarHymnNumber, hymnFortyArrangement],
  [hymnFortyOneArrangement.myanmarHymnNumber, hymnFortyOneArrangement],
  [hymnFortyTwoArrangement.myanmarHymnNumber, hymnFortyTwoArrangement],
  [hymnFortyThreeArrangement.myanmarHymnNumber, hymnFortyThreeArrangement],
  [hymnFortyFourArrangement.myanmarHymnNumber, hymnFortyFourArrangement],
  [hymnFortyFiveArrangement.myanmarHymnNumber, hymnFortyFiveArrangement],
  [hymnFortySixArrangement.myanmarHymnNumber, hymnFortySixArrangement],
  [hymnFortySevenArrangement.myanmarHymnNumber, hymnFortySevenArrangement],
  [hymnFortyEightArrangement.myanmarHymnNumber, hymnFortyEightArrangement],
  [hymnFortyNineArrangement.myanmarHymnNumber, hymnFortyNineArrangement],
  [hymnFiftyArrangement.myanmarHymnNumber, hymnFiftyArrangement],
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
