import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
import { parseHymnalGuitarSvgByVerseOrder, parseYpGuitarSvg, ypGuitarHasChords } from "@/lib/hymns/yp-guitar";

function englishReferenceNumber(reference:string|undefined):number|undefined {
  const value=reference?.trim().match(/^(\d+)(?:\(\d+\))?$/)?.[1];
  if(!value)return undefined;
  const parsed=Number(value);
  return Number.isInteger(parsed)?parsed:undefined;
}

function guitarSvgUrl(englishNumber:number):string {
  return `https://www.hymnal.net/Hymns/Hymnal/svg/e${String(englishNumber).padStart(4,"0")}_g.svg`;
}

function normalizeHymnalSvg(svg:string):string {
  return svg
    .replace(/font-family="Century Schoolbook L"/g,'font-family="serif"')
    .replace(
      /(<g\b[^>]*\btransform="translate\(\s*([-\d.]+)\s*(?:,\s*|\s+)([-\d.]+)\s*\)"[^>]*>\s*)<text\b(?![^>]*\btransform=)([^>]*)>/g,
      (_match,prefix,x,y,attrs)=>`${prefix}<text transform="translate(${x}, ${y})"${attrs}>`,
    );
}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const hymnNumber=Number(id);
  if(!Number.isInteger(hymnNumber)||hymnNumber<111||hymnNumber>700)return NextResponse.json({error:"Invalid hymn number"},{status:400});

  const myanmar=getHymn("hymns","my",String(hymnNumber));
  if(!myanmar)return NextResponse.json({error:"Myanmar hymn unavailable"},{status:404});

  const englishNumber=englishReferenceNumber(myanmar.cross_references.Eng);
  if(!englishNumber)return NextResponse.json({error:"No verified Hymnal.net source"},{status:404});

  const english=getHymn("hymns","en",String(englishNumber));
  if(!english&&hymnNumber!==700)return NextResponse.json({error:"English hymn data unavailable"},{status:404});

  try {
    const response=await fetch(guitarSvgUrl(englishNumber),{next:{revalidate:60*60*24*30}});
    if(!response.ok)return NextResponse.json({error:"Guitar source unavailable"},{status:404});
    const svg=normalizeHymnalSvg(await response.text());
    const guitar=hymnNumber===700
      ? parseHymnalGuitarSvgByVerseOrder(svg,myanmar.sections)
      : parseYpGuitarSvg(svg,english!.sections,myanmar.sections);
    if(!ypGuitarHasChords(guitar))return NextResponse.json({error:"Structured chords unavailable"},{status:404});
    return NextResponse.json({sourceLabel:`E${englishNumber}`,...guitar},{headers:{"Cache-Control":"public, s-maxage=2592000, stale-while-revalidate=604800"}});
  } catch {
    return NextResponse.json({error:"Unable to load guitar chords"},{status:502});
  }
}
