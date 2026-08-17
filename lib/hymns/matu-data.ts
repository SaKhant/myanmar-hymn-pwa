import "server-only";
import { brotliDecompressSync } from "node:zlib";
import type { HymnRecord, HymnSection } from "./types";
import p01 from "./matu-parts/part01";
import p02 from "./matu-parts/part02";
import p03 from "./matu-parts/part03";
import p04 from "./matu-parts/part04";
import p05 from "./matu-parts/part05";
import p06 from "./matu-parts/part06";
import p07 from "./matu-parts/part07";
import p08 from "./matu-parts/part08";
import p09 from "./matu-parts/part09";
import p10 from "./matu-parts/part10";
import p11 from "./matu-parts/part11";

type CompactSection = ["v" | "c", number | null, string];

type CompactMatuRecord = {
  n: number;
  t: string | null;
  e: number | null;
  s: CompactSection[];
  r?: string;
};

const encoded = p01 + p02 + p03 + p04 + p05 + p06 + p07 + p08 + p09 + p10 + p11;
const compactRecords = JSON.parse(
  brotliDecompressSync(Buffer.from(encoded, "base64")).toString("utf8"),
) as CompactMatuRecord[];

function expandMatuRecord(record: CompactMatuRecord): HymnRecord {
  const sections: HymnSection[] = record.s.map(([type, number, text]) => ({
    type: type === "v" ? "verse" : "chorus",
    number,
    lines: text.split("\n"),
  }));

  const firstLine = sections.flatMap((section) => section.lines).find(Boolean) ?? null;
  const lyricsText = sections
    .map((section) => {
      const heading = section.type === "verse" ? String(section.number ?? "") : "Chorus";
      return [heading, ...section.lines].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return {
    id: String(record.n),
    number: record.n,
    collection: "matu_hymns" as HymnRecord["collection"],
    language: "matu" as HymnRecord["language"],
    title: firstLine,
    first_line: firstLine,
    theme: record.t,
    page_heading: `#${record.n}`,
    metadata: record.r ? { Scripture: record.r } : {},
    cross_references: {
      Myanmar: String(record.n),
      ...(record.e ? { Eng: String(record.e) } : {}),
    },
    audio_url: null,
    sections,
    source_file: `mthymns/${record.n}.html`,
    lyrics_text: lyricsText,
  };
}

export const matuHymns = compactRecords.map(expandMatuRecord);
