import "server-only";

import type { HymnRecord } from "./types";
import type { GuitarArrangement, GuitarSegment } from "./guitar-types";

const hymnOneArrangement: GuitarArrangement = {
  myanmarHymnNumber: 1,
  englishSourceNumber: 1,
  originalKey: "Ab Major",
  originalKeyDisplay: "A♭",
  playKey: "G",
  capo: 1,
  verses: [
    { number: 1, lines: [
      { segments: [{ text: "ခမည်းတော် ဘု", chord: "G" }, { text: "ရား ဘုန်းကြီးစေ၊", chord: "C" }] },
      { segments: [{ text: "သားတော် ဘုန်းကြီး", chord: "G" }, { text: "စေ", chord: "D" }] },
      { segments: [{ text: "သန့်ရှင်းဝိညာဉ်", chord: "G" }, { text: "တော် ဘုန်းကြီးစေ၊", chord: "C" }] },
      { segments: [{ text: "ထာ", chord: "D" }, { text: "ဝ", chord: "D7" }, { text: "ရ။", chord: "G" }] },
    ] },
    { number: 2, lines: [
      { segments: [{ text: "ကြီးမားဖန်ဆင်း", chord: "G" }, { text: "ခြင်းကို မြင်ရ", chord: "C" }] },
      { segments: [{ text: "ကြံစည်တော်လက်", chord: "G" }, { text: "ရာ", chord: "D" }] },
      { segments: [{ text: "ကိုယ်တော်ကို ဝတ်", chord: "G" }, { text: "ပြုကိုးကွယ်မည်", chord: "C" }] },
      { segments: [{ text: "အ", chord: "D" }, { text: "စဉ်", chord: "D7" }, { text: "မြဲ။", chord: "G" }] },
    ] },
    { number: 3, lines: [
      { segments: [{ text: "မည်မျှကြီးမား ဘု", chord: "G" }, { text: "ရားတမ်းတ", chord: "C" }] },
      { segments: [{ text: "ချစ်သားများရ", chord: "G" }, { text: "ရန်", chord: "D" }] },
      { segments: [{ text: "သားတော်၌ မေတ္", chord: "G" }, { text: "တာတော်ပြပြီ", chord: "C" }] },
      { segments: [{ text: "ချီး", chord: "D" }, { text: "မွမ်း", chord: "D7" }, { text: "မည်။", chord: "G" }] },
    ] },
    { number: 4, lines: [
      { segments: [{ text: "ကြံစည်တော်ကို ဖွင့်", chord: "G" }, { text: "ပြမူပြီ", chord: "C" }] },
      { segments: [{ text: "လူတို့အား သိ", chord: "G" }, { text: "စေ", chord: "D" }] },
      { segments: [{ text: "ကိုယ်တော်၏လျှို့ဝှက်", chord: "G" }, { text: "မေတ္တာတော်", chord: "C" }] },
      { segments: [{ text: "ပိုင်", chord: "D" }, { text: "စေ", chord: "D7" }, { text: "ပြီ။", chord: "G" }] },
    ] },
    { number: 5, lines: [
      { segments: [{ text: "ခရစ်တော်၌ ရွေး", chord: "G" }, { text: "နုတ်ခြင်းဖြင့်", chord: "C" }] },
      { segments: [{ text: "တန်ခိုးဆိုးကို", chord: "G" }, { text: "အောင်", chord: "D" }] },
      { segments: [{ text: "ဖန်ဆင်းခြင်းအ", chord: "G" }, { text: "သစ်ကို ယူဆောင်", chord: "C" }] },
      { segments: [{ text: "ဝတ်", chord: "D" }, { text: "ပြု", chord: "D7" }, { text: "သူ။", chord: "G" }] },
    ] },
    { number: 6, lines: [
      { segments: [{ text: "ခမည်းတော်ဘု", chord: "G" }, { text: "ရားဘုန်းကြီးစေ", chord: "C" }] },
      { segments: [{ text: "သားတော်ဘုန်းကြီး", chord: "G" }, { text: "စေ", chord: "D" }] },
      { segments: [{ text: "သန့်ရှင်းဝိညာဉ်", chord: "G" }, { text: "တော်ဘုန်းကြီးစေ", chord: "C" }] },
      { segments: [{ text: "ထာ", chord: "D" }, { text: "ဝ", chord: "D7" }, { text: "ရ။", chord: "G" }] },
    ] },
  ],
};

const arrangementsByMyanmarNumber = new Map<number, GuitarArrangement>([
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
  const arrangement = arrangementsByMyanmarNumber.get(hymn.number);
  if (!arrangement) return undefined;

  const englishReference = hymn.cross_references.Eng?.trim().match(/^(\d+)(?:\(\d+\))?$/)?.[1];
  if (englishReference !== String(arrangement.englishSourceNumber)) return undefined;
  if (!matchesLyrics(hymn, arrangement)) return undefined;
  return arrangement;
}
