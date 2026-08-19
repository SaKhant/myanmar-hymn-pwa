import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
import { getNewMyanmarTranslation } from "@/lib/hymns/new-translations";
import { parseNumberedTranslationLines } from "@/lib/hymns/translation-display";
import { parseYpGuitarSvg, ypGuitarHasChords, type YpChordEvent } from "@/lib/hymns/yp-guitar";

function guitarSvgUrl(englishNumber:number):string {
  return `https://www.hymnal.net/Hymns/Hymnal/svg/e${String(englishNumber).padStart(4,"0")}_g.svg`;
}

function normalizeHymnalSvg(svg:string):string {
  return svg
    .replace(/font-family="Century Schoolbook L"/g,'font-family="serif"')
    .replace(/(<g\b[^>]*\btransform="translate\(\s*([-\d.]+)\s*(?:,\s*|\s+)([-\d.]+)\s*\)"[^>]*>\s*)<text\b(?![^>]*\btransform=)([^>]*)>/g,(_match,prefix,x,y,attrs)=>`${prefix}<text transform="translate(${x}, ${y})"${attrs}>`);
}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const item=getNewMyanmarTranslation(id);
  if(!item)return NextResponse.json({error:"Translation unavailable"},{status:404});
  const english=getHymn("hymns","en",String(item.english_number));
  if(!english)return NextResponse.json({error:"English hymn data unavailable"},{status:404});
  const display=parseNumberedTranslationLines(item.raw_lines);

  try{
    const response=await fetch(guitarSvgUrl(item.english_number),{next:{revalidate:60*60*24*30}});
    if(!response.ok)return NextResponse.json({error:"Guitar source unavailable"},{status:404});
    const svg=normalizeHymnalSvg(await response.text());
    const englishGuitar=parseYpGuitarSvg(svg,english.sections,english.sections);
    if(!ypGuitarHasChords(englishGuitar))return NextResponse.json({error:"Structured chords unavailable"},{status:404});

    const sections=display.map(section=>{
      const patterns:YpChordEvent[][]=[];
      if(section.number!==null){
        const verseIndex=english.sections.findIndex(candidate=>candidate.type==="verse"&&candidate.number===section.number);
        if(verseIndex>=0){
          for(let index=verseIndex;index<english.sections.length;index++){
            if(index>verseIndex&&english.sections[index].type==="verse")break;
            const source=englishGuitar.sections[index];
            if(source)patterns.push(...source.lines.map(line=>line.chords));
          }
        }
      }else{
        for(let index=0;index<english.sections.length&&english.sections[index].type!=="verse";index++){
          const source=englishGuitar.sections[index];
          if(source)patterns.push(...source.lines.map(line=>line.chords));
        }
      }
      let lyricIndex=0;
      const lines=section.lines.map(line=>{
        if(line.kind!=="lyric")return {chords:[] as YpChordEvent[]};
        const pattern=patterns[lyricIndex++]??[];
        return {chords:pattern.map(event=>({...event}))};
      });
      return {type:section.number===null?"text":"verse",number:section.number,lines};
    });

    if(!sections.some(section=>section.lines.some(line=>line.chords.length)))return NextResponse.json({error:"Structured chords unavailable"},{status:404});
    return NextResponse.json({sourceLabel:`E${item.english_number}`,capo:englishGuitar.capo,sections},{headers:{"Cache-Control":"public, s-maxage=2592000, stale-while-revalidate=604800"}});
  }catch{
    return NextResponse.json({error:"Unable to load guitar chords"},{status:502});
  }
}
