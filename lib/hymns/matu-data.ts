import "server-only";
import type { HymnRecord } from "./types";
import matuRecords from "@/hymn_dataset/matu_hymns.json";

export const matuHymns = matuRecords as unknown as HymnRecord[];
