import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
import { getNewMyanmarTranslations } from "@/lib/hymns/new-translations";
import { getNewYpTranslations } from "@/lib/hymns/new-yp-translations";
import { parseNewYpTranslationLines, parseNumberedTranslationLines } from "@/lib/hymns/translation-display";
import { parseHymnalGuitarSvgBySectionShape, parseYpGuitarSvg, ypGuitarHasChords } from "@/lib/hymns/yp-guitar";
import type { HymnSection } from "@/lib/hymns/types";

function normalizeHymnalSvg(svg:string):string {
  return svg
    .replace(/font-family="Century Schoolbook L"/g,'font-family="serif"')
    .replace(/(<g\b[^>]*\btransform="translate\(\s*([-\d.]+)\s*(?:,\s*|\s+)([-\d.]+)\s*\)"[^>]*>\s*)<text\b(?![^>]*\btransform=)([^>]*)>/g,(_match,prefix,x,y,attrs)=>`${prefix}<text transform="translate(${x}, ${y})"${attrs}>`);
}

function hymnUrl(number:number){return `https://www.hymnal.net/Hymns/Hymnal/svg/e${String(number).padStart(4,"0")}_g.svg`;}
function ypUrl(kind:"NS"|"H"|"LB",number:number){
  if(kind==="NS")return `https://www.hymnal.net/Hymns/NewSongs/svg/ns${String(number).padStart(4,"0")}_g.svg`;
  if(kind==="LB")return `https://www.hymnal.net/Hymns/LongBeach/svg/lb${String(number).padStart(2,"0")}_g.svg`;
  return hymnUrl(number);
}

async function auditHymn(index:number){
  const item=getNewMyanmarTranslations()[index];
  if(!item)return {index,status:"missing"};
  const english=getHymn("hymns","en",String(item.english_number));
  if(!english)return {index,id:item.id,number:item.english_number,status:"missing-english"};
  const display=parseNumberedTranslationLines(item.raw_lines);
  try{
    const response=await fetch(hymnUrl(item.english_number),{cache:"no-store"});
    if(!response.ok)return {index,id:item.id,number:item.english_number,status:`source-${response.status}`};
    const parsed=parseYpGuitarSvg(normalizeHymnalSvg(await response.text()),english.sections,english.sections);
    if(!ypGuitarHasChords(parsed))return {index,id:item.id,number:item.english_number,status:"no-chords"};
    let mapped=0,lyric=0;
    for(const section of display){
      const patterns=[] as Array<Array<{chord:string;position:number}>>;
      if(section.number!==null){
        const verseIndex=english.sections.findIndex(candidate=>candidate.type==="verse"&&candidate.number===section.number);
        if(verseIndex>=0){
          for(let i=verseIndex;i<english.sections.length;i++){
            if(i>verseIndex&&english.sections[i].type==="verse")break;
            patterns.push(...(parsed.sections[i]?.lines.map(line=>line.chords)??[]));
          }
        }
      }
      let p=0;
      for(const line of section.lines){
        if(line.kind!=="lyric")continue;
        lyric++;if((patterns[p++]??[]).length)mapped++;
      }
    }
    return {index,id:item.id,number:item.english_number,status:mapped>0?"available":"unmapped",mapped,lyric};
  }catch{return {index,id:item.id,number:item.english_number,status:"fetch-error"};}
}

async function auditYp(index:number){
  const item=getNewYpTranslations()[index];
  if(!item)return {index,status:"missing"};
  if(!item.source_kind||item.source_number==null)return {index,id:item.id,ref:item.source_ref,status:"no-source"};
  if(item.source_kind==="NS"&&item.source_number===6871)return {index,id:item.id,ref:item.source_ref,status:"known-missing-source"};
  const display=parseNewYpTranslationLines(item.raw_lines);
  const lyricSections:HymnSection[]=display.map(section=>({type:section.number===null?"text":"verse",number:section.number,lines:section.lines.filter(line=>line.kind==="lyric").map(line=>line.text)})).filter(section=>section.lines.length>0);
  try{
    const response=await fetch(ypUrl(item.source_kind,item.source_number),{cache:"no-store"});
    if(!response.ok)return {index,id:item.id,ref:item.source_ref,status:`source-${response.status}`};
    const parsed=parseHymnalGuitarSvgBySectionShape(normalizeHymnalSvg(await response.text()),lyricSections);
    const lyric=lyricSections.reduce((sum,section)=>sum+section.lines.length,0);
    const mapped=parsed.sections.reduce((sum,section)=>sum+section.lines.filter(line=>line.chords.length).length,0);
    return {index,id:item.id,ref:item.source_ref,status:mapped>0?"available":"unmapped",mapped,lyric};
  }catch{return {index,id:item.id,ref:item.source_ref,status:"fetch-error"};}
}

export async function GET(request:Request){
  const url=new URL(request.url);
  const kind=url.searchParams.get("kind")==="yp"?"yp":"hymn";
  const start=Math.max(0,Number(url.searchParams.get("start")??0));
  const limit=Math.min(10,Math.max(1,Number(url.searchParams.get("limit")??10)));
  const total=kind==="yp"?getNewYpTranslations().length:getNewMyanmarTranslations().length;
  const indices=Array.from({length:Math.max(0,Math.min(limit,total-start))},(_,offset)=>start+offset);
  const results=await Promise.all(indices.map(index=>kind==="yp"?auditYp(index):auditHymn(index)));
  return NextResponse.json({kind,start,total,results});
}
