import type { HymnSection } from "./types";

export interface GuitarSegment {
  text: string;
  chord?: string;
}

export interface GuitarLine {
  segments: GuitarSegment[];
}

export interface GuitarVerse {
  number: number;
  lines: GuitarLine[];
}

export type GuitarArrangementStatus = "reviewed" | "needs-review" | "unavailable";

export interface GuitarArrangement {
  myanmarHymnNumber: number;
  englishSourceNumber: number;
  originalKey: string;
  originalKeyDisplay: string;
  playKey: string;
  capo: number;
  timeSignature?: string;
  meter?: string;
  chordsUsed: string[];
  status: GuitarArrangementStatus;
  verses: GuitarVerse[];
}

export interface GuitarReaderProps {
  sections: HymnSection[];
  arrangement: GuitarArrangement;
}
