import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
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
  return svg.replace(/font-family="Century Schoolbook L"/g,'font-family="serif"');
}

function svgSummary(svg:string){
  const textTags=[...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)];
  const parsed=textTags.map(match=>{
    const transform=match[1].match(/transform="translate\(\s*([-\d.]+)\s*,?\s+([-\d.]+)\s*\)"/);
    const family=match[1].match(/font-family="([^"]+)"/)?.[1]??"";
    const fontSize=Number(match[1].match(/font-size="([^"]+)"/)?.[1]??0);
    const text=match[2].replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&#x266D;/gi,"b").trim();
    return {x:transform?Number(transform[1]):0,y:transform?Number(transform[2]):0,family,fontSize,text};
  });
  const samples=parsed.slice(0,160).map(item=>item.text).filter(Boolean);
  const families=[...new Set(parsed.map(item=>item.family).filter(Boolean))];
  const sizes=[...new Set(parsed.map(item=>String(item.fontSize)).filter(Boolean))];
  const roots=parsed.filter(item=>item.family.includes("sans-serif")&&/^[A-G]$/i.test(item.text));
  const lyrics=parsed.filter(item=>(item.family.includes("serif")||item.family.includes("Century Schoolbook"))&&item.fontSize>=2.25&&item.fontSize<=2.8);
  const gaps=roots.slice(0,30).map(root=>{
    const next=lyrics.filter(lyric=>lyric.y>root.y).sort((a,b)=>(a.y-root.y)-(b.y-root.y))[0];
    return next?Number((next.y-root.y).toFixed(3)):null;
  });
  return {length:svg.length,textCount:textTags.length,families,sizes,gaps,attributeSamples:textTags.slice(0,25).map(match=>match[1]),samples};
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

async function inspect(hymnNumber:number){
  const myanmar=getHymn("hymns","my",String(hymnNumber));
  const englishNumber=englishReferenceNumber(myanmar?.cross_references.Eng);
  if(!myanmar||!englishNumber)return {hymnNumber,error:"missing mapping"};
  const response=await fetch(guitarSvgUrl(englishNumber),{cache:"no-store"});
  const svg=await response.text();
  return {hymnNumber,englishNumber,status:response.status,summary:svgSummary(svg)};
}

export async function GET(request:Request){
  const inspectParam=new URL(request.url).searchParams.get("inspect");
  if(inspectParam){
    const numbers=inspectParam.split(",").map(Number).filter(value=>Number.isInteger(value)&&value>=111&&value<=200).slice(0,6);
    return NextResponse.json({inspection:await Promise.all(numbers.map(inspect))});
  }
  const results=[] as Awaited<ReturnType<typeof audit>>[];
  for(let start=111;start<=200;start+=10){
    const batch=Array.from({length:Math.min(10,201-start)},(_,index)=>start+index);
    results.push(...await Promise.all(batch.map(audit)));
  }
  return NextResponse.json({available:results.filter(item=>item.status==="available"),skipped:results.filter(item=>item.status!=="available")});
}
