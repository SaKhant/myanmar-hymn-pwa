import { NextResponse } from "next/server";
import { getHymn, getHymns } from "@/lib/hymns/data";
import { parseYpGuitarSvg, ypGuitarHasChords } from "@/lib/hymns/yp-guitar";

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

async function audit(hymnNumber:number){
  const myanmar=getHymn("hymns","my",String(hymnNumber));
  if(!myanmar)return {hymnNumber,status:"missing-myanmar"};
  const englishNumber=englishReferenceNumber(myanmar.cross_references.Eng);
  if(!englishNumber)return {hymnNumber,status:"no-reference"};
  const english=getHymn("hymns","en",String(englishNumber));
  if(!english)return {hymnNumber,englishNumber,status:"missing-english"};
  try {
    const response=await fetch(guitarSvgUrl(englishNumber),{cache:"no-store"});
    if(!response.ok)return {hymnNumber,englishNumber,status:`source-${response.status}`};
    const svg=normalizeHymnalSvg(await response.text());
    const guitar=parseYpGuitarSvg(svg,english.sections,myanmar.sections);
    return {hymnNumber,englishNumber,status:ypGuitarHasChords(guitar)?"available":"no-structured-chords"};
  } catch {
    return {hymnNumber,englishNumber,status:"fetch-error"};
  }
}

export async function GET(request:Request){
  const url=new URL(request.url);
  const start=Math.max(201,Number(url.searchParams.get("start")??201));
  const end=Math.min(700,Number(url.searchParams.get("end")??700));
  if(!Number.isInteger(start)||!Number.isInteger(end)||start>end)return NextResponse.json({error:"Invalid range"},{status:400});
  const numbers=getHymns("hymns","my")
    .map(hymn=>hymn.number)
    .filter((number):number is number=>typeof number==="number"&&Number.isInteger(number)&&number>=start&&number<=end);
  const results=[] as Awaited<ReturnType<typeof audit>>[];
  for(let index=0;index<numbers.length;index+=20){
    results.push(...await Promise.all(numbers.slice(index,index+20).map(audit)));
  }
  const skipped=results.filter(item=>item.status!=="available");
  return NextResponse.json({start,end,total:results.length,availableCount:results.length-skipped.length,skipped});
}
