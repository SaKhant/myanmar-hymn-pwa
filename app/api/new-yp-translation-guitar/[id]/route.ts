import { NextResponse } from "next/server";
import { parseTranslationLeadSheetByShape } from "@/lib/hymns/new-translation-guitar";
import { getNewYpTranslation } from "@/lib/hymns/new-yp-translations";
import { parseNewYpTranslationLines } from "@/lib/hymns/translation-display";
import { ypGuitarHasChords, type YpChordEvent } from "@/lib/hymns/yp-guitar";
import type { HymnSection } from "@/lib/hymns/types";

function guitarSvgUrl(kind:"NS"|"H"|"LB",number:number):string {
  if(kind==="NS")return `https://www.hymnal.net/Hymns/NewSongs/svg/ns${String(number).padStart(4,"0")}_g.svg`;
  if(kind==="LB")return `https://www.hymnal.net/Hymns/LongBeach/svg/lb${String(number).padStart(2,"0")}_g.svg`;
  return `https://www.hymnal.net/Hymns/Hymnal/svg/e${String(number).padStart(4,"0")}_g.svg`;
}

function normalizeHymnalSvg(svg:string):string {
  return svg
    .replace(/font-family="Century Schoolbook L"/g,'font-family="serif"')
    .replace(/(<g\b[^>]*\btransform="translate\(\s*([-\d.]+)\s*(?:,\s*|\s+)([-\d.]+)\s*\)"[^>]*>\s*)<text\b(?![^>]*\btransform=)([^>]*)>/g,(_match,prefix,x,y,attrs)=>`${prefix}<text transform="translate(${x}, ${y})"${attrs}>`);
}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const item=getNewYpTranslation(id);
  if(!item)return NextResponse.json({error:"Translation unavailable"},{status:404});
  if(!item.source_kind||item.source_number==null)return NextResponse.json({error:"No verified Hymnal.net source"},{status:404});

  const display=parseNewYpTranslationLines(item.raw_lines);
  const lyricSections:HymnSection[]=display.map(section=>({
    type:section.number===null?"text":"verse",
    number:section.number,
    lines:section.lines.filter(line=>line.kind==="lyric").map(line=>line.text),
  })).filter(section=>section.lines.length>0);

  try{
    const response=await fetch(guitarSvgUrl(item.source_kind,item.source_number),{next:{revalidate:60*60*24*30}});
    if(!response.ok)return NextResponse.json({error:"Guitar source unavailable"},{status:404});
    const svg=normalizeHymnalSvg(await response.text());
    const parsed=parseTranslationLeadSheetByShape(svg,lyricSections);
    if(!ypGuitarHasChords(parsed))return NextResponse.json({error:"Structured chords unavailable"},{status:404});

    let sourceSectionIndex=0;
    const sections=display.map(section=>{
      const lyricCount=section.lines.filter(line=>line.kind==="lyric").length;
      const source=lyricCount>0?parsed.sections[sourceSectionIndex++]:undefined;
      let lyricIndex=0;
      const lines=section.lines.map(line=>{
        if(line.kind!=="lyric")return {chords:[] as YpChordEvent[]};
        const chords=source?.lines[lyricIndex++]?.chords??[];
        return {chords:chords.map(event=>({...event}))};
      });
      return {type:section.number===null?"text":"verse",number:section.number,lines};
    });

    const label=item.source_ref??`${item.source_kind} ${item.source_number}`;
    return NextResponse.json({sourceLabel:label,capo:parsed.capo,sections},{headers:{"Cache-Control":"public, s-maxage=2592000, stale-while-revalidate=604800"}});
  }catch{
    return NextResponse.json({error:"Unable to load guitar chords"},{status:502});
  }
}
