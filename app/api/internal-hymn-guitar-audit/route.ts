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

function parsedText(svg:string){
  const normalized=normalizeHymnalSvg(svg);
  return [...normalized.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].map(match=>{
    const attrs=match[1];
    const family=attrs.match(/font-family="([^"]+)"/)?.[1]??"";
    const size=Number(attrs.match(/font-size="([^"]+)"/)?.[1]??0);
    const transform=attrs.match(/transform="translate\(\s*([-\d.]+)\s*(?:,\s*|\s+)([-\d.]+)\s*\)"/);
    const text=match[2].replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&#x266D;/gi,"b").replace(/&#x266F;/gi,"#").trim();
    return {x:transform?Number(transform[1]):0,y:transform?Number(transform[2]):0,family,size,hasTransform:Boolean(transform),text};
  });
}

function rowGroups(svg:string){
  const lyrics=parsedText(svg).filter(item=>item.family.includes("serif")&&!item.family.includes("sans-serif")&&item.size>=2.25&&item.size<=2.8&&item.text);
  const groups:Array<typeof lyrics>=[];
  for(const item of [...lyrics].sort((a,b)=>a.y-b.y||a.x-b.x)){
    const group=groups.find(candidate=>Math.abs(candidate[0].y-item.y)<=.24);
    if(group)group.push(item); else groups.push([item]);
  }
  return groups.slice(0,24).map(group=>{
    const sorted=[...group].sort((a,b)=>a.x-b.x);
    return {y:Number((group.reduce((sum,item)=>sum+item.y,0)/group.length).toFixed(3)),minX:sorted[0]?.x,maxX:sorted.at(-1)?.x,text:sorted.map(item=>item.text).join(" ")};
  });
}

function inspectSvg(svg:string){
  const parsed=parsedText(svg);
  const families=[...new Set(parsed.map(item=>item.family).filter(Boolean))];
  const sizes=[...new Set(parsed.map(item=>item.size).filter(Boolean))].sort((a,b)=>a-b);
  const chordLike=parsed.filter(item=>/^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*$/i.test(item.text));
  return {
    length:svg.length,
    textCount:parsed.length,
    transformedCount:parsed.filter(item=>item.hasTransform).length,
    families,
    sizes,
    chordFamilies:[...new Set(chordLike.map(item=>item.family))],
    chordSizes:[...new Set(chordLike.map(item=>item.size))].sort((a,b)=>a-b),
    chordSamples:chordLike.slice(0,30).map(item=>item.text),
    rows:rowGroups(svg),
  };
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
  const english=getHymn("hymns","en",String(englishNumber));
  const response=await fetch(guitarSvgUrl(englishNumber),{cache:"no-store"});
  if(!response.ok)return {hymnNumber,englishNumber,status:response.status};
  return {hymnNumber,englishNumber,status:response.status,englishSections:english?.sections,summary:inspectSvg(await response.text())};
}

export async function GET(request:Request){
  const url=new URL(request.url);
  const inspectParam=url.searchParams.get("inspect");
  if(inspectParam){
    const numbers=inspectParam.split(",").map(Number).filter(value=>Number.isInteger(value)&&value>=201&&value<=700).slice(0,8);
    return NextResponse.json({inspection:await Promise.all(numbers.map(inspect))});
  }
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
