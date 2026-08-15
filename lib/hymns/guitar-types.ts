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

export interface GuitarArrangement {
  myanmarHymnNumber: number;
  englishSourceNumber: number;
  originalKey: string;
  originalKeyDisplay: string;
  playKey: string;
  capo: number;
  verses: GuitarVerse[];
}

export interface GuitarReaderProps {
  sections: HymnSection[];
  arrangement: GuitarArrangement;
}
