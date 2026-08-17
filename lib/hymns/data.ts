import "server-only";
import englishHymns from "@/hymn_dataset/english_hymns.json";
import myanmarHymns from "@/hymn_dataset/myanmar_hymns.json";
import englishYp from "@/hymn_dataset/english_yp.json";
import myanmarYp from "@/hymn_dataset/myanmar_yp.json";
import myanmarYp165170 from "@/hymn_dataset/myanmar_yp_165_170.json";
import myanmarYp171176 from "@/hymn_dataset/myanmar_yp_171_176.json";
import myanmarYp177178 from "@/hymn_dataset/myanmar_yp_177_178.json";
import myanmarYp179182 from "@/hymn_dataset/myanmar_yp_179_182.json";
import myanmarYp183188 from "@/hymn_dataset/myanmar_yp_183_188.json";
import myanmarYp189194 from "@/hymn_dataset/myanmar_yp_189_194.json";
import categories from "@/hymn_dataset/categories.json";
import type { HymnCategory, HymnCollection, HymnKind, HymnLanguage, HymnRecord, HymnSummary } from "./types";
import { normalizeSearchText } from "./search";

const collections: Record<HymnCollection, HymnRecord[]> = {
  myanmar_hymns: myanmarHymns as unknown as HymnRecord[],
  english_hymns: englishHymns as unknown as HymnRecord[],
  myanmar_yp: [
    ...(myanmarYp as unknown as HymnRecord[]),
    ...(myanmarYp165170 as unknown as HymnRecord[]),
    ...(myanmarYp171176 as unknown as HymnRecord[]),
    ...(myanmarYp177178 as unknown as HymnRecord[]),
    ...(myanmarYp179182 as unknown as HymnRecord[]),
    ...(myanmarYp183188 as unknown as HymnRecord[]),
    ...(myanmarYp189194 as unknown as HymnRecord[]),
  ],
  english_yp: englishYp as unknown as HymnRecord[],
};

function isNumberedMyanmarHymn(hymn: HymnRecord): boolean {
  return typeof hymn.number === "number" && Number.isInteger(hymn.number);
}

const numberedMyanmarHymns = collections.myanmar_hymns.filter(isNumberedMyanmarHymn);

export function collectionKey(kind: HymnKind, language: HymnLanguage): HymnCollection {
  return `${language === "my" ? "myanmar" : "english"}_${kind}` as HymnCollection;
}

export function getHymns(kind: HymnKind, language: HymnLanguage): HymnRecord[] {
  const key = collectionKey(kind, language);
  return key === "myanmar_hymns" ? numberedMyanmarHymns : collections[key];
}

export function getHymn(kind: HymnKind, language: HymnLanguage, id: string): HymnRecord | undefined {
  return getHymns(kind, language).find((hymn) => hymn.id === id || String(hymn.number) === id);
}

export function getAdjacentHymns(kind: HymnKind, language: HymnLanguage, id: string) {
  const hymns = getHymns(kind, language);
  const index = hymns.findIndex((hymn) => hymn.id === id || String(hymn.number) === id);
  return { previous: index > 0 ? hymns[index - 1] : null, next: index >= 0 && index < hymns.length - 1 ? hymns[index + 1] : null };
}

export function toSummary(hymn: HymnRecord, kind: HymnKind): HymnSummary {
  const title = hymn.title?.trim() || hymn.first_line?.trim() || `Hymn ${hymn.number ?? hymn.id}`;
  const firstLine = hymn.first_line?.trim() || "";
  const lyricSections = hymn.sections.flatMap((section) => section.lines).join(" ");
  const searchFields = hymn.collection === "myanmar_hymns" || hymn.collection === "myanmar_yp"
    ? [hymn.number, title, firstLine, hymn.lyrics_text, lyricSections]
    : [hymn.number, title, firstLine, hymn.theme, hymn.lyrics_text, lyricSections];
  return {
    id: hymn.id,
    number: hymn.number,
    collection: hymn.collection,
    language: hymn.language,
    kind,
    title,
    firstLine,
    theme: hymn.theme?.trim() || "",
    searchText: normalizeSearchText(searchFields.filter(Boolean).join(" ")),
    lyricSearchText: normalizeSearchText([hymn.lyrics_text, lyricSections].filter(Boolean).join(" ")),
  };
}

export function getSummaries(kind: HymnKind, language: HymnLanguage): HymnSummary[] {
  return getHymns(kind, language).map((hymn) => toSummary(hymn, kind));
}

export function getCategories(): HymnCategory[] {
  return categories as HymnCategory[];
}
