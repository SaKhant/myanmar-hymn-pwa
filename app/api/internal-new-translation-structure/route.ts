import { NextResponse } from "next/server";
import { getHymn } from "@/lib/hymns/data";
import { getNewMyanmarTranslations } from "@/lib/hymns/new-translations";
import { getNewYpTranslations } from "@/lib/hymns/new-yp-translations";

const BURMESE_DIGITS:Record<string,string>={"၀":"0","၁":"1","၂":"2","၃":"3","၄":"4","၅":"5","၆":"6","၇":"7","၈":"8","၉":"9"};
function arabic(value:string){return value.replace(/[၀-၉]/g,d=>BURMESE_DIGITS[d]??d)}
function split(raw:string[]){
  const out:Array<{number:number|null;lines:string[]}>=[];
  let current:{number:number|null;lines:string[]}|null=null;
  for(const line of raw){
    const m=line.match(/^\s*([၀-၉0-9]+)[။.]\s*(.*)$/);
    if(m){if(current)out.push(current);current={number:Number(arabic(m[1])),lines:[m[2]]};}
    else if(current)current.lines.push(line);
    else if(line.trim())current={number:null,lines:[line]};
  }
  if(current)out.push(current);
  return out;
}
function ypShape(raw:string[]){
  const verses:Array<{number:number;lines:number}>=[];
  let intro=0,current:number|null=null,count=0,repeats=0;
  const flush=()=>{if(current!==null)verses.push({number:current,lines:count});};
  for(const rawLine of raw){
    const line=rawLine.trim(); if(!line)continue;
    if(/^ထပ်ဆို\s*[၀-၉0-9]+/.test(line)){repeats++;continue;}
    const m=line.match(/^([၀-၉0-9]+)[။.]\s*(.*)$/);
    if(m){flush();current=Number(arabic(m[1]));count=m[2].trim()?1:0;continue;}
    if(current===null)intro++; else count++;
  }
  flush(); return {intro,verses,repeats};
}
export async function GET(){
  const hymns=getNewMyanmarTranslations().map(item=>{
    const sections=split(item.raw_lines);
    const english=getHymn("hymns","en",String(item.english_number));
    return {n:item.english_number,my:sections.map(s=>({n:s.number,l:s.lines.filter(x=>x.trim()&&x.trim()!=="...").length})),en:english?.sections.map(s=>({t:s.type,n:s.number,l:s.lines.length}))??null};
  });
  const yp=getNewYpTranslations().map(item=>({id:item.id,ref:item.source_ref,kind:item.source_kind,n:item.source_number,shape:ypShape(item.raw_lines)}));
  return NextResponse.json({hymnCount:hymns.length,hymns,ypCount:yp.length,yp});
}
