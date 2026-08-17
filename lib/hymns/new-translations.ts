import "server-only";
import { gunzipSync } from "node:zlib";
import { NEW_TRANSLATIONS_GZIP_BASE64 } from "@/lib/hymns/new-translations-data";

export type NewMyanmarTranslation = {
  id:string;
  english_number:number;
  myanmar_number:null;
  status:"unassigned";
  category:string;
  english_title:string|null;
  meter:string|null;
  title:string;
  verse_numbers:number[];
  source_note:string|null;
  raw_lines:string[];
  header_lines:string[];
  source_number_line:string;
};

let cached:NewMyanmarTranslation[]|null=null;

export function getNewMyanmarTranslations():NewMyanmarTranslation[]{
  if(cached)return cached;
  const json=gunzipSync(Buffer.from(NEW_TRANSLATIONS_GZIP_BASE64,"base64")).toString("utf8");
  cached=JSON.parse(json) as NewMyanmarTranslation[];
  return cached;
}

export function getNewMyanmarTranslation(id:string):NewMyanmarTranslation|undefined{
  const normalized=id.toLowerCase().replace(/^eng-/,"");
  return getNewMyanmarTranslations().find(item=>String(item.english_number)===normalized||item.id===id);
}

export function getNewMyanmarTranslationSummaries(){
  return getNewMyanmarTranslations().map(item=>({
    id:item.id,
    englishNumber:item.english_number,
    title:item.title,
    category:item.category,
    englishTitle:item.english_title,
    searchText:`${item.english_number} ${item.title} ${item.category} ${item.english_title??""}`.toLocaleLowerCase(),
  }));
}
