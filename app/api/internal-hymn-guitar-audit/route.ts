import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
import { parseYpGuitarSvg, ypGuitarHasChords } from "@/lib/hymns/yp-guitar";

function englishReferenceNumber(reference:string|undefined):number|undefined {
  const value=reference?.trim().match(/^(\d+)(?:\(\d+\))?$/)?.[1];
  if(!value)return undefined;
  const parsed=Number(value);
  return Number.isInteger(parsed)?parsed:undefined;
}

async function audit(hymnNumber:number){
  const myanmar=getHymn("hymns","my",String(hymnNumber));
  if(!myanmar)return {hymnNumber,status:"missing-myanmar"};
  const englishNumber=englishReferenceNumber(myanmar.cross_references.Eng);
  if(!englishNumber)return {hymnNumber,status:"no-reference"};
  const english=getHymn("hymns","en",String(englishNumber));
  if(!english)return {hymnNumber,englishNumber,status:"missing-english"};
  const url=`https://www.hymnal.net/Hymns/Hymnal/svg/e${String(englishNumber).padStart(4,"0")}_g.svg`;
  try {
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)return {hymnNumber,englishNumber,status:`source-${response.status}`};
    const svg=await response.text();
    const guitar=parseYpGuitarSvg(svg,english.sections,myanmar.sections);
    return {hymnNumber,englishNumber,status:ypGuitarHasChords(guitar)?"available":"no-structured-chords"};
  } catch {
    return {hymnNumber,englishNumber,status:"fetch-error"};
  }
}

export async function GET(){
  const results=[] as Awaited<ReturnType<typeof audit>>[];
  for(let start=111;start<=200;start+=10){
    const batch=Array.from({length:Math.min(10,201-start)},(_,index)=>start+index);
    results.push(...await Promise.all(batch.map(audit)));
  }
  return NextResponse.json({available:results.filter(item=>item.status==="available"),skipped:results.filter(item=>item.status!=="available")});
}
