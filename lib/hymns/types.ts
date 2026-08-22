export type HymnLanguage = "my" | "en";
export type HymnKind = "hymns" | "yp";
export type HymnCollection = "myanmar_hymns" | "english_hymns" | "myanmar_yp" | "english_yp";

export interface HymnSection {
  type: "verse" | "chorus" | "refrain" | string;
  number: number | null;
  lines: string[];
}

export interface HymnRecord {
  id: string;
  number: number | null;
  collection: HymnCollection;
  language: HymnLanguage;
  title: string | null;
  first_line: string | null;
  theme: string | null;
  page_heading: string | null;
  metadata: Record<string, string>;
  cross_references: Record<string, string>;
  audio_url: string | null;
  sections: HymnSection[];
  lyrics_text: string;
  source_file: string;
}

export interface HymnReference {
  number: number;
  first_line: string | null;
}

export interface HymnSubcategory {
  slug: string;
  title: string;
  hymns: HymnReference[];
}

export interface HymnCategory {
  slug: string;
  category: string;
  hymns: HymnReference[];
  subcategories?: HymnSubcategory[];
  source_file: string;
}

export interface HymnSummary {
  id: string;
  number: number | null;
  collection: HymnCollection;
  language: HymnLanguage;
  kind: HymnKind;
  title: string;
  firstLine: string;
  theme: string;
  searchText: string;
  lyricSearchText: string;
}
