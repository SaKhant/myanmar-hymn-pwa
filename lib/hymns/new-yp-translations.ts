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

export function getNewYpAudioUrl(item:Pick<NewYpTranslation,"source_kind"|"source_number">):string|undefined{
  const number=item.source_number;
  if(number==null)return undefined;

  if(item.source_kind==="NS"){
    // The uploaded source also contains an NS 6871 entry, but hymnal.net has no NS6871 page.
    // Keep the source text untouched and simply avoid attaching a broken audio URL to that record.
    if(number===6871)return undefined;
    return `https://www.hymnal.net/Hymns/NewSongs/mp3/ns${String(number).padStart(4,"0")}.mp3`;
  }

  if(item.source_kind==="LB"){
    return `https://www.hymnal.net/Hymns/LongBeach/mp3/lb${number}.mp3`;
  }

  if(item.source_kind==="H"&&number===6871){
    return "https://www.hymnal.net/Hymns/Hymnal/mp3/e6871_i.mp3";
  }

  return undefined;
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
