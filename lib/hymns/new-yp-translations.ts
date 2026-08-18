import "server-only";
import { gunzipSync } from "node:zlib";
import { NEW_YP_TRANSLATIONS_GZIP_BASE64 } from "@/lib/hymns/new-yp-translations-data";

export type NewYpTranslation = {
  id:string;
  title:string;
  source_ref:string|null;
  source_kind:"NS"|"H"|"LB"|null;
  source_number:number|null;
  raw_lines:string[];
};

let cached:NewYpTranslation[]|null=null;

export function getNewYpTranslations():NewYpTranslation[]{
  if(cached)return cached;
  const json=gunzipSync(Buffer.from(NEW_YP_TRANSLATIONS_GZIP_BASE64,"base64")).toString("utf8");
  cached=JSON.parse(json) as NewYpTranslation[];
  return cached;
}

export function getNewYpTranslation(id:string):NewYpTranslation|undefined{
  return getNewYpTranslations().find(item=>item.id===id);
}

export function getNewYpTranslationSummaries(){
  return getNewYpTranslations().map(item=>({
    id:item.id,
    title:item.title,
    sourceRef:item.source_ref,
    sourceNumber:item.source_number,
    searchText:`${item.source_ref??""} ${item.source_number??""} ${item.title} ${item.raw_lines.join(" ")}`.toLocaleLowerCase(),
  }));
}
