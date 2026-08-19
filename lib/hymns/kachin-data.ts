import "server-only";
import { brotliDecompressSync } from "node:zlib";
import type { HymnRecord, HymnSection } from "./types";
import p01 from "./kachin-parts/part01";
import p02 from "./kachin-parts/part02";
import p03 from "./kachin-parts/part03";
import p04 from "./kachin-parts/part04";
import p05 from "./kachin-parts/part05";
import p06 from "./kachin-parts/part06";
import p07 from "./kachin-parts/part07";
import p08 from "./kachin-parts/part08";
import p09 from "./kachin-parts/part09";
import p10 from "./kachin-parts/part10";
import p11 from "./kachin-parts/part11";
import p12 from "./kachin-parts/part12";
import p13 from "./kachin-parts/part13";
import p14 from "./kachin-parts/part14";
import p15 from "./kachin-parts/part15";
import p16 from "./kachin-parts/part16";

type CompactSection = ["v" | "c", number | null, string];
type CompactKachinRecord = { n: number; t: string | null; m?: number; e?: number; s: CompactSection[] };

const encoded = p01 + p02 + p03 + p04 + p05 + p06 + p07 + p08 + p09 + p10 + p11 + p12 + p13 + p14 + p15 + p16;
const compactRecords = JSON.parse(
  brotliDecompressSync(Buffer.from(encoded, "base64")).toString("utf8"),
) as CompactKachinRecord[];

function expandKachinRecord(record: CompactKachinRecord): HymnRecord {
  const sections: HymnSection[] = record.s.map(([type, number, text]) => ({
    type: type === "v" ? "verse" : "chorus",
    number,
    lines: text.split(/\n+/),
  }));
  const firstLine = sections.flatMap((section) => section.lines).find(Boolean) ?? null;
  const lyricsText = sections.map((section) => {
    const heading = section.type === "verse" ? String(section.number ?? "") : "Chorus";
    return [heading, ...section.lines].filter(Boolean).join("\n");
  }).join("\n\n");
  return {
    id: String(record.n), number: record.n,
    collection: "kachin_hymns" as HymnRecord["collection"],
    language: "kachin" as HymnRecord["language"],
    title: firstLine, first_line: firstLine, theme: record.t, page_heading: `#${record.n}`, metadata: {},
    cross_references: { ...(record.m ? { Myanmar: String(record.m) } : {}), ...(record.e ? { Eng: String(record.e) } : {}) },
    audio_url: null, sections, source_file: `kchymns/${record.n}.html`, lyrics_text: lyricsText,
  };
}

export const kachinHymns = compactRecords.map(expandKachinRecord);
const kachinByNumber = new Map(kachinHymns.map((hymn) => [String(hymn.number), hymn]));
const kachinByMyanmarNumber = new Map(kachinHymns.filter((hymn) => hymn.cross_references.Myanmar).map((hymn) => [hymn.cross_references.Myanmar, hymn]));
export function getKachinHymn(id: string): HymnRecord | undefined { return kachinByNumber.get(id); }
export function getKachinHymnByMyanmarNumber(number: number | string): HymnRecord | undefined { return kachinByMyanmarNumber.get(String(number)); }
