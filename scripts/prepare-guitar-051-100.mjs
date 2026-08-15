#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const START = 51;
const END = 100;
const OUT_ROOT = resolve(PROJECT_ROOT, "hymn_dataset/guitar/generated/batch-051-100");
const OUT_ARR = resolve(OUT_ROOT, "arrangements");

const myanmarHymns = JSON.parse(await readFile(resolve(PROJECT_ROOT, "hymn_dataset/myanmar_hymns.json"), "utf8"));
const englishHymns = JSON.parse(await readFile(resolve(PROJECT_ROOT, "hymn_dataset/english_hymns.json"), "utf8"));

const EXPECTED_MAP = new Map([
  [51,51],[52,52],[53,53],[54,54],[55,55],[56,1081],[57,56],[58,57],[59,61],[60,62],
  [61,64],[62,65],[63,66],[64,67],[65,68],[66,73],[67,82],[68,84],[69,85],[70,86],
  [71,87],[72,88],[73,94],[74,95],[75,98],[76,107],[77,108],[78,111],[79,116],[80,117],
  [81,118],[82,119],[83,123],[84,124],[85,132],[86,139],[87,140],[88,142],[89,145],[90,149],
  [91,152],[92,162],[93,165],[94,170],[95,173],[96,175],[97,177],[98,190],[99,1103],[100,203],
]);

const namedEntities = new Map([
  ["amp","&"],["nbsp"," "],["quot",'"'],["apos","'"],["lt","<"],["gt",">"],
  ["flat","♭"],["sharp","♯"],["ndash","–"],["mdash","—"],["rsquo","’"],["lsquo","‘"],
  ["ldquo","“"],["rdquo","”"],["hellip","…"],["eacute","é"],["egrave","è"],
]);

function decodeHtml(s) {
  return s
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => namedEntities.get(n.toLowerCase()) ?? m);
}

function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]*>/g, ""));
}

function cleanChord(raw) {
  return stripTags(raw)
    .replace(/\s+/g, "")
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .replace(/\^\{([^}]+)\}/g, "$1")
    .replace(/\^([0-9]+)/g, "$1")
    .trim();
}

function normalizeText(s) {
  return decodeHtml(s)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function htmlToChordMarkerText(html) {
  let t = html.replace(/<span\b[^>]*class=["'][^"']*\bchord\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    (_, inner) => `⟦CH:${cleanChord(inner)}⟧`);
  t = t.replace(/<br\s*\/?>/gi, "\n")
       .replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, "\n")
       .replace(/<[^>]+>/g, "");
  return decodeHtml(t).replace(/\r/g, "");
}

function detail(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<label[^>]*>\\s*${escaped}:?\\s*<\\/label>[\\s\\S]*?<div[^>]*>([\\s\\S]*?)<\\/div>`, "i");
  return stripTags(html.match(re)?.[1] ?? "").replace(/\s+/g, " ").trim();
}

function keyToken(s) {
  return s.replace(/\s+Major$/i, "").replace(/\s+Minor$/i, "m").replace(/♭/g,"b").replace(/♯/g,"#").trim();
}
const pitch = {C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
function capoFor(original, play) {
  const o = pitch[keyToken(original).replace(/m$/,"")];
  const p = pitch[keyToken(play).replace(/m$/,"")];
  return o === undefined || p === undefined ? 0 : (o - p + 12) % 12;
}
function displayKey(k) { return k.replace(/\b([A-G])b\b/g,"$1♭").replace(/\b([A-G])#\b/g,"$1♯").replace(/\s+Major$/i,"").replace(/\s+Minor$/i,"m"); }

function graphemes(text) {
  if (globalThis.Intl?.Segmenter) {
    const seg = new Intl.Segmenter("my", { granularity: "grapheme" });
    return [...seg.segment(text)].map(x => x.segment);
  }
  return Array.from(text);
}

function numberWord(n) {
  const small = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = {20:"Twenty",30:"Thirty",40:"Forty",50:"Fifty",60:"Sixty",70:"Seventy",80:"Eighty",90:"Ninety",100:"OneHundred"};
  if (n < 20) return small[n];
  if (tens[n]) return tens[n];
  return tens[Math.floor(n/10)*10] + small[n%10];
}

function sourcePatternSections(english) {
  const sections = english.sections ?? [];
  const firstVerseIndex = sections.findIndex(s => s.type === "verse");
  if (firstVerseIndex < 0) return [];
  const out = [sections[firstVerseIndex]];
  for (let i = firstVerseIndex + 1; i < sections.length; i++) {
    if (sections[i].type === "verse") break;
    if (["chorus","refrain"].includes(sections[i].type)) out.push(sections[i]);
  }
  return out;
}

function chordEventsFromHtml(html, targetSections) {
  const markerText = htmlToChordMarkerText(html);
  const markerRe = /⟦CH:([^⟧]+)⟧/g;
  const markers = [...markerText.matchAll(markerRe)].filter(m => m[1]);
  if (!markers.length) return { events: [], similarity: 0, reason: "No inline chord markers found." };

  const first = markers[0].index;
  const last = markers[markers.length - 1];
  let tailEnd = markerText.indexOf("\n", last.index + last[0].length);
  if (tailEnd < 0) tailEnd = markerText.length;
  const region = markerText.slice(first, tailEnd);

  const events = [];
  let lyricNorm = "";
  let cursor = 0;
  for (const m of region.matchAll(markerRe)) {
    const before = region.slice(cursor, m.index);
    lyricNorm += normalizeText(before);
    events.push({ chord: cleanChord(m[1]), pos: lyricNorm.length });
    cursor = m.index + m[0].length;
  }
  lyricNorm += normalizeText(region.slice(cursor));

  const targetLines = [];
  for (const sec of targetSections) {
    for (let i=0;i<sec.lines.length;i++) targetLines.push({ type:sec.type, sectionNumber:sec.number, lineIndex:i, text:sec.lines[i] });
  }
  const targetNorm = targetLines.map(x => normalizeText(x.text)).join("");
  if (!targetNorm.length || !lyricNorm.length) return { events: [], similarity: 0, reason: "Could not normalize source lyric/chord region." };

  // Estimate alignment quality using longest common subsequence-like matching blocks via a lightweight greedy scan.
  let i=0, j=0, matches=0;
  const checkpoints = [];
  while (i < lyricNorm.length && j < targetNorm.length) {
    if (lyricNorm[i] === targetNorm[j]) { checkpoints.push([i,j]); matches++; i++; j++; continue; }
    const nextTarget = targetNorm.indexOf(lyricNorm[i], j+1);
    const nextLyric = lyricNorm.indexOf(targetNorm[j], i+1);
    if (nextTarget >= 0 && (nextLyric < 0 || nextTarget-j <= nextLyric-i)) j = nextTarget;
    else if (nextLyric >= 0) i = nextLyric;
    else { i++; j++; }
  }
  const similarity = matches / Math.max(targetNorm.length, lyricNorm.length, 1);

  function mapPos(srcPos) {
    if (!checkpoints.length) return Math.round(srcPos * targetNorm.length / lyricNorm.length);
    let lo = null, hi = null;
    for (const cp of checkpoints) {
      if (cp[0] <= srcPos) lo = cp;
      if (cp[0] >= srcPos) { hi = cp; break; }
    }
    if (lo && hi && hi[0] !== lo[0]) {
      const f = (srcPos - lo[0])/(hi[0]-lo[0]);
      return Math.round(lo[1] + f*(hi[1]-lo[1]));
    }
    if (lo) return Math.min(targetNorm.length, lo[1] + (srcPos-lo[0]));
    if (hi) return Math.max(0, hi[1] - (hi[0]-srcPos));
    return Math.round(srcPos * targetNorm.length / lyricNorm.length);
  }

  const lineRanges = [];
  let total=0;
  for (const line of targetLines) {
    const len = normalizeText(line.text).length;
    lineRanges.push({ ...line, start:total, end:total+len, len });
    total += len;
  }

  const mapped = events.map(ev => {
    const p = Math.max(0, Math.min(targetNorm.length, mapPos(ev.pos)));
    let line = lineRanges.find(r => p < r.end) ?? lineRanges[lineRanges.length-1];
    const rel = line?.len ? Math.max(0, Math.min(1, (p-line.start)/line.len)) : 0;
    return { chord:ev.chord, sourcePos:p, type:line?.type, sectionNumber:line?.sectionNumber, lineIndex:line?.lineIndex ?? 0, rel };
  }).filter(e => e.chord);

  return { events:mapped, similarity, reason: mapped.length ? null : "Chord markers could not be mapped to source lyric." };
}

function sectionPattern(events, type) {
  return events.filter(e => e.type === type);
}

function eventsForMyanmarSection(patternEvents, sourceSection, mySection) {
  if (!patternEvents.length) return [];
  const srcLines = sourceSection.lines ?? [];
  const myLines = mySection.lines ?? [];
  const sameLineCount = srcLines.length === myLines.length;
  const out = myLines.map(() => []);

  if (sameLineCount) {
    for (const ev of patternEvents) {
      if (ev.lineIndex >= myLines.length) continue;
      const gs = graphemes(myLines[ev.lineIndex]);
      const pos = Math.min(Math.max(0, Math.round(ev.rel * Math.max(gs.length-1,0))), Math.max(gs.length-1,0));
      out[ev.lineIndex].push({ chord:ev.chord, pos });
    }
  } else {
    const srcLens = srcLines.map(x => Math.max(normalizeText(x).length,1));
    const srcTotal = srcLens.reduce((a,b)=>a+b,0);
    const srcStarts=[]; let s=0; for (const len of srcLens){srcStarts.push(s);s+=len;}
    const myGs = myLines.map(graphemes);
    const myLens = myGs.map(g => Math.max(g.length,1));
    const myTotal = myLens.reduce((a,b)=>a+b,0);
    const myStarts=[]; let m=0; for (const len of myLens){myStarts.push(m);m+=len;}
    for (const ev of patternEvents) {
      const si = Math.min(ev.lineIndex, srcLens.length-1);
      const globalSrc = srcStarts[si] + ev.rel*srcLens[si];
      const globalMy = (globalSrc/srcTotal)*myTotal;
      let li = myLens.findIndex((len, idx) => globalMy < myStarts[idx]+len);
      if (li < 0) li = myLens.length-1;
      const local = globalMy - myStarts[li];
      const pos = Math.min(Math.max(0, Math.round(local)), Math.max(myGs[li].length-1,0));
      out[li].push({chord:ev.chord,pos});
    }
  }
  return out;
}

function buildSegments(text, rawEvents, inheritedChord) {
  const gs = graphemes(text);
  if (!gs.length) return { segments:[{text}], endingChord:inheritedChord };
  const events = rawEvents.slice().sort((a,b)=>a.pos-b.pos);
  const merged=[];
  for (const ev of events) {
    let pos=Math.max(0,Math.min(gs.length-1,ev.pos));
    if (merged.length && merged[merged.length-1].pos===pos) {
      merged[merged.length-1] = {pos, chord:ev.chord};
    } else merged.push({pos,chord:ev.chord});
  }
  if (!merged.length) merged.push({pos:0,chord:inheritedChord});
  else if (merged[0].pos>0 && inheritedChord) merged.unshift({pos:0,chord:inheritedChord});
  const segments=[];
  for (let i=0;i<merged.length;i++) {
    const st=merged[i].pos;
    const en=i+1<merged.length?merged[i+1].pos:gs.length;
    if (en<=st) continue;
    const seg={text:gs.slice(st,en).join("")};
    if (merged[i].chord) seg.chord=merged[i].chord;
    segments.push(seg);
  }
  if (segments.length && merged[0].pos>0) {
    const prefix=gs.slice(0,merged[0].pos).join("");
    if(prefix) segments.unshift({text:prefix, ...(inheritedChord?{chord:inheritedChord}:{})});
  }
  return {segments, endingChord:merged.at(-1)?.chord ?? inheritedChord};
}

function splitTextSafe(text, max=28) {
  const g=graphemes(text);
  if(g.length<=max) return [text];
  const chunks=[]; let rest=text;
  while(graphemes(rest).length>max){
    const rg=graphemes(rest);
    let cut=max;
    for(let i=Math.min(max,rg.length-1);i>=Math.floor(max*0.55);i--){
      if(/[\s၊၊။,;:!?—-]/u.test(rg[i-1])){cut=i;break;}
    }
    chunks.push(rg.slice(0,cut).join(""));
    rest=rg.slice(cut).join("");
  }
  if(rest) chunks.push(rest);
  return chunks;
}

function phraseify(segments, max=28) {
  const units=[];
  for(const seg of segments){
    const chunks=splitTextSafe(seg.text,max);
    chunks.forEach((text,i)=>units.push({text,...(i===0&&seg.chord?{chord:seg.chord}:{})}));
  }
  const phrases=[]; let cur=[]; let count=0;
  for(const u of units){
    const n=graphemes(u.text).length;
    if(cur.length && count+n>max){phrases.push({segments:cur});cur=[];count=0;}
    cur.push(u);count+=n;
  }
  if(cur.length) phrases.push({segments:cur});
  return phrases.length>1 ? {phrases} : {segments};
}

async function inspect(number, english, myanmar) {
  const url=`https://www.hymnal.net/en/hymn/h/${number}`;
  const resp=await fetch(url,{headers:{"User-Agent":"Myanmar-Hymn-PWA guitar arrangement preparation"}});
  if(!resp.ok) return {ok:false,url,reason:`HTTP ${resp.status}`};
  const html=await resp.text();
  const patternSections=sourcePatternSections(english);
  const parsed=chordEventsFromHtml(html,patternSections);
  let originalKey=detail(html,"Key") || myanmar.metadata?.Key || "";
  let playKey=stripTags(html.match(/id=["']fromkeysig["'][^>]*>([\s\S]*?)<\/[^>]+>/i)?.[1] ?? "").replace(/\s+/g," ").trim();
  if(!playKey) {
    const top=stripTags(html.slice(0,Math.min(html.length,30000))).replace(/\s+/g," ");
    const keyPair=top.match(/([A-G](?:♭|♯|b|#)?\s+(?:Major|Minor))\s+([A-G](?:♭|♯|b|#)?\s+(?:Major|Minor))/i);
    if(keyPair){ if(!originalKey) originalKey=keyPair[1]; playKey=keyPair[2]; }
  }
  if(!playKey) playKey=originalKey;
  const timeSignature=detail(html,"Time") || myanmar.metadata?.Time || "";
  const meter=detail(html,"Meter") || myanmar.metadata?.Meter || "";
  const chordsUsed=[...new Set(parsed.events.map(e=>e.chord))];
  return {ok:parsed.events.length>0,url,html,patternSections,events:parsed.events,similarity:parsed.similarity,reason:parsed.reason,originalKey,playKey:keyToken(playKey),capo:capoFor(originalKey,playKey),timeSignature,meter,chordsUsed};
}

await mkdir(OUT_ARR,{recursive:true});
const report=[];
for(let n=START;n<=END;n++){
  const my=myanmarHymns.find(h=>h.number===n);
  if(!my){ report.push({myanmarHymnNumber:n,status:"unavailable",reason:"Myanmar record missing"}); continue; }
  const raw=String(my.cross_references?.Eng??"").trim();
  const engNo=Number(raw.match(/^(\d+)/)?.[1]);
  const expected=EXPECTED_MAP.get(n);
  if(!engNo || engNo!==expected){ report.push({myanmarHymnNumber:n,myanmarTitle:my.title,englishReference:raw,status:"unavailable",reason:`Cross-reference mismatch; expected ${expected}, dataset says ${raw||"missing"}`}); continue; }
  const en=englishHymns.find(h=>h.number===engNo);
  if(!en){report.push({myanmarHymnNumber:n,myanmarTitle:my.title,englishSourceNumber:engNo,status:"unavailable",reason:"English source record missing from local dataset"});continue;}
  let source;
  try{source=await inspect(engNo,en,my);}catch(err){source={ok:false,url:`https://www.hymnal.net/en/hymn/h/${engNo}`,reason:err instanceof Error?err.message:String(err)};}
  if(!source.ok){report.push({myanmarHymnNumber:n,myanmarTitle:my.title,englishSourceNumber:engNo,sourceUrl:source.url,status:"unavailable",reason:source.reason||"No reliable inline chord data"});continue;}

  const sourceByType=new Map();
  for(const sec of source.patternSections) if(!sourceByType.has(sec.type)) sourceByType.set(sec.type,sec);
  const eventsByType=new Map();
  for(const type of sourceByType.keys()) eventsByType.set(type,sectionPattern(source.events,type));

  let activeChord=source.chordsUsed[0]??source.playKey;
  const verses=[]; let structuralIssue=null;
  for(const sec of my.sections){
    const srcSec=sourceByType.get(sec.type) ?? (sec.type==="refrain"?sourceByType.get("chorus"):sec.type==="chorus"?sourceByType.get("refrain"):sourceByType.get("verse"));
    const pattern=eventsByType.get(sec.type) ?? (sec.type==="refrain"?eventsByType.get("chorus"):sec.type==="chorus"?eventsByType.get("refrain"):eventsByType.get("verse"));
    if(!srcSec || !pattern?.length){structuralIssue=`No source chord pattern for section type ${sec.type}`;break;}
    const lineEvents=eventsForMyanmarSection(pattern,srcSec,sec);
    const lines=[];
    for(let i=0;i<sec.lines.length;i++){
      const built=buildSegments(sec.lines[i],lineEvents[i]??[],activeChord);
      activeChord=built.endingChord;
      const total=graphemes(sec.lines[i]).length;
      lines.push(total>30?phraseify(built.segments,27):{segments:built.segments});
    }
    verses.push({type:sec.type,number:sec.number,lines});
  }
  if(structuralIssue){report.push({myanmarHymnNumber:n,myanmarTitle:my.title,englishSourceNumber:engNo,sourceUrl:source.url,status:"needs-review",reason:structuralIssue,similarity:source.similarity});continue;}

  const arrangement={
    myanmarHymnNumber:n,englishSourceNumber:engNo,
    originalKey:source.originalKey || my.metadata?.Key || "",
    originalKeyDisplay:displayKey(source.originalKey || my.metadata?.Key || ""),
    playKey:source.playKey || keyToken(source.originalKey || my.metadata?.Key || ""),
    capo:source.capo ?? 0,
    ...(source.timeSignature?{timeSignature:source.timeSignature}:{}),
    ...(source.meter?{meter:source.meter}:{}),
    chordsUsed:source.chordsUsed,
    status: source.similarity>=0.82 ? "reviewed" : "needs-review",
    verses,
  };
  const reconstructed=verses.map(s=>s.lines.map(l=> (l.segments??l.phrases.flatMap(p=>p.segments)).map(x=>x.text).join("")));
  const originals=my.sections.map(s=>s.lines);
  const exact=JSON.stringify(reconstructed)===JSON.stringify(originals);
  if(!exact) arrangement.status="needs-review";
  const exportName=`hymn${numberWord(n)}Arrangement`;
  const ts=`import type { GuitarArrangement } from "../../guitar-types";\n\nexport const ${exportName}: GuitarArrangement = ${JSON.stringify(arrangement,null,2)};\n`;
  await writeFile(resolve(OUT_ARR,`${String(n).padStart(3,"0")}.ts`),ts,"utf8");
  report.push({myanmarHymnNumber:n,myanmarTitle:my.title,englishSourceNumber:engNo,sourceUrl:source.url,originalKey:arrangement.originalKeyDisplay,playKey:arrangement.playKey,capo:arrangement.capo,chordsUsed:arrangement.chordsUsed,sourceAlignmentSimilarity:Number(source.similarity.toFixed(3)),exactMyanmarReconstruction:exact,status:arrangement.status,reason:arrangement.status==="reviewed"?"Source chords mapped; exact Myanmar text reconstruction passed.":"Generated but requires manual review before production."});
  console.log(`MY ${n} -> ENG ${engNo}: ${arrangement.status} (${source.similarity.toFixed(3)})`);
}

await writeFile(resolve(OUT_ROOT,"report.json"),JSON.stringify({schemaVersion:1,range:{start:START,end:END},generatedAt:new Date().toISOString(),records:report},null,2)+"\n","utf8");
const rows=report.map(r=>`| ${r.myanmarHymnNumber} | ${r.englishSourceNumber??"—"} | ${r.originalKey??"—"} | ${r.playKey??"—"} | ${r.capo??"—"} | ${r.status} | ${String(r.reason??"").replace(/\|/g,"\\|")} |`);
await writeFile(resolve(OUT_ROOT,"report.md"),[
  "# Guitar batch 051–100", "", "This report is generated by the prepared source-alignment script. `reviewed` means source/mapping/structure/text validation passed; it is still wise to ear-check representative songs before scaling further.", "",
  "| MY | ENG | Key | Play | Capo | Status | Note |", "|---:|---:|---|---|---:|---|---|", ...rows, ""
].join("\n"),"utf8");
console.log(`\nWrote staged arrangements and report to ${OUT_ROOT}`);
