import type { HymnKind, HymnLanguage } from "./hymns/types";

export type StoredHymn = { id: string; kind: HymnKind; language: HymnLanguage; number: number | null; title: string };
export const FAVORITES_KEY = "hymn-house:favorites";
export const FONT_SIZE_KEY = "hymn-house:font-size";

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

export function writeStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("hymn-storage"));
}
