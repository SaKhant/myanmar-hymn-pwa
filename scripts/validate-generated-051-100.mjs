#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(SCRIPT_DIR,"..");
const ARR=resolve(ROOT,"hymn_dataset/guitar/generated/batch-051-100/arrangements");
const my=JSON.parse(await readFile(resolve(ROOT,"hymn_dataset/myanmar_hymns.json"),"utf8"));
let failed=0, reviewed=0, needs=0;
for(const f of (await readdir(ARR)).filter(x=>/^\d{3}\.ts$/.test(x)).sort()){
  const src=await readFile(resolve(ARR,f),"utf8");
  const m=src.match(/=\s*({[\s\S]*})\s*;\s*$/);
  if(!m){console.error(`${f}: cannot parse object`);failed++;continue;}
  const a=JSON.parse(m[1]);
  const h=my.find(x=>x.number===a.myanmarHymnNumber);
  const eng=Number(String(h?.cross_references?.Eng??"").match(/^(\d+)/)?.[1]);
  if(!h || eng!==a.englishSourceNumber){console.error(`${f}: MY→ENG mismatch`);failed++;continue;}
  const reconstructed=a.verses.map(s=>s.lines.map(l=>(l.segments??(l.phrases??[]).flatMap(p=>p.segments)).map(x=>x.text).join("")));
  const original=h.sections.map(s=>s.lines);
  if(JSON.stringify(reconstructed)!==JSON.stringify(original)){console.error(`${f}: lyric reconstruction mismatch`);failed++;continue;}
  if(a.verses.length!==h.sections.length || a.verses.some((s,i)=>s.type!==h.sections[i].type||s.number!==h.sections[i].number||s.lines.length!==h.sections[i].lines.length)){
    console.error(`${f}: section structure mismatch`);failed++;continue;
  }
  const used=new Set(a.verses.flatMap(s=>s.lines.flatMap(l=>(l.segments??(l.phrases??[]).flatMap(p=>p.segments)).map(x=>x.chord).filter(Boolean))));
  if([...used].some(c=>!a.chordsUsed.includes(c))){console.error(`${f}: chord missing from chordsUsed`);failed++;continue;}
  if(a.status==="reviewed")reviewed++; else needs++;
  console.log(`${f}: PASS (${a.status})`);
}
console.log(`\nPASS summary: reviewed=${reviewed}, needs-review=${needs}, failed=${failed}`);
if(failed) process.exit(1);
