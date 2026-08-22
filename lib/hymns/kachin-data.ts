import "server-only";
import type { HymnRecord } from "./types";
import kachinRecords from "@/hymn_dataset/kachin_hymns.json";

export const kachinHymns = kachinRecords as unknown as HymnRecord[];
const kachinByNumber = new Map(kachinHymns.map((hymn) => [String(hymn.number), hymn]));
const kachinByMyanmarNumber = new Map(kachinHymns.filter((hymn) => hymn.cross_references.Myanmar).map((hymn) => [hymn.cross_references.Myanmar, hymn]));
export function getKachinHymn(id: string): HymnRecord | undefined { return kachinByNumber.get(id); }
export function getKachinHymnByMyanmarNumber(number: number | string): HymnRecord | undefined { return kachinByMyanmarNumber.get(String(number)); }
