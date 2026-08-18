import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
import { ypSource, ypSourceLabel } from "@/lib/hymns/yp-sources";
import { parseYpGuitarSvg, ypGuitarHasChords } from "@/lib/hymns/yp-guitar";

function guitarSvgUrl(ypNumber:number):string|undefined {
  const source=ypSource(ypNumber);
  if(!source)return undefined;
  const number4=String(source.number).padStart(4,"0");
  if(source.collection==="ns")return `https://www.hymnal.net/Hymns/NewSongs/svg/ns${number4}_g.svg`;
  if(source.collection==="lb")return `https://www.hymnal.net/Hymns/LongBeach/svg/lb${String(source.number).padStart(2,"0")}_g.svg`;
  if(source.collection==="c")return `https://www.hymnal.net/Hymns/Children/svg/child${number4}_g.svg`;
  return `https://www.hymnal.net/Hymns/Hymnal/svg/e${number4}_g.svg`;
}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const ypNumber=Number(id);
  if(!Number.isInteger(ypNumber)||ypNumber<1||ypNumber>200)return NextResponse.json({error:"Invalid YP number"},{status:400});

  const source=ypSource(ypNumber);
  const sourceLabel=ypSourceLabel(ypNumber);
  const svgUrl=guitarSvgUrl(ypNumber);
  if(!source||!sourceLabel||!svgUrl)return NextResponse.json({error:"No verified Hymnal.net source"},{status:404});

  const myanmar=getHymn("yp","my",String(ypNumber));
  const english=getHymn("yp","en",String(ypNumber));
  if(!myanmar||!english)return NextResponse.json({error:"YP song data unavailable"},{status:404});

  try {
    const response=await fetch(svgUrl,{next:{revalidate:60*60*24*30}});
    if(!response.ok)return NextResponse.json({error:"Guitar source unavailable"},{status:404});
    const svg=await response.text();
    const guitar=parseYpGuitarSvg(svg,english.sections,myanmar.sections);
    if(!ypGuitarHasChords(guitar))return NextResponse.json({error:"Structured chords unavailable"},{status:404});
    return NextResponse.json({sourceLabel,...guitar},{headers:{"Cache-Control":"public, s-maxage=2592000, stale-while-revalidate=604800"}});
  } catch {
    return NextResponse.json({error:"Unable to load guitar chords"},{status:502});
  }
}
