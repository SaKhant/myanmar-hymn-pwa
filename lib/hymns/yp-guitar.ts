import "server-only";
import type { HymnSection } from "./types";

export type YpChordEvent={chord:string;position:number};
export type YpGuitarLine={chords:YpChordEvent[]};
export type YpGuitarSection={type:string;number:number|null;lines:YpGuitarLine[]};
export type YpGuitarData={capo:number|null;sections:YpGuitarSection[]};

type SvgText={x:number;y:number;family:string;fontSize:number;text:string};
type ChordRow={y:number;chords:Array<{chord:string;x:number}>;lyricText:string;lyricMinX:number;lyricMaxX:number};

const CHORD_TOKEN=/^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?$/i;

function decodeXml(value:string):string {
  return value
    .replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16)))
    .replace(/&#(\d+);/g,(_,num)=>String.fromCodePoint(Number(num)))
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,'"').replace(/&apos;/g,"'");
}

function attr(attrs:string,name:string):string|undefined {
  return attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
}

function parseSvgText(svg:string):SvgText[] {
  const elements:SvgText[]=[];
  const re=/<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match:RegExpExecArray|null;
  while((match=re.exec(svg))){
    const attrs=match[1];
    const transform=attr(attrs,"transform")?.match(/translate\(\s*([-\d.]+)\s*,?\s+([-\d.]+)\s*\)/);
    if(!transform)continue;
    const family=attr(attrs,"font-family")??"";
    const fontSize=Number(attr(attrs,"font-size")??0);
    const body=match[2];
    const tspans=[...body.matchAll(/<tspan[^>]*>([\s\S]*?)<\/tspan>/g)].map(item=>decodeXml(item[1].replace(/<[^>]+>/g,"")));
    const text=(tspans.length?tspans.join(""):decodeXml(body.replace(/<[^>]+>/g,""))).trim();
    if(!text)continue;
    elements.push({x:Number(transform[1]),y:Number(transform[2]),family,fontSize,text});
  }
  return elements;
}

function normalizeChordFragment(text:string):string {
  return text.trim().replace(/♭/g,"b").replace(/♯/g,"#").replace(/\s+/g,"");
}

function likelyChord(value:string):boolean {
  if(value.length<1||value.length>14||!/^[A-G]/.test(value))return false;
  return /^[A-G](?:#|b)?[A-Za-z0-9#b/+()°øΔ-]*$/.test(value);
}

function clusterByY<T extends {y:number}>(items:T[],tolerance:number):T[][] {
  const groups:T[][]=[];
  for(const item of [...items].sort((a,b)=>a.y-b.y)){
    const group=groups.find(candidate=>Math.abs(candidate[0].y-item.y)<=tolerance);
    if(group)group.push(item); else groups.push([item]);
  }
  return groups;
}

function normalizeLyric(value:string):string {
  return value.toLocaleLowerCase("en").normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu,"");
}

function diceScore(a:string,b:string):number {
  if(!a||!b)return 0;
  if(a===b)return 1;
  if(a.includes(b)||b.includes(a))return Math.min(a.length,b.length)/Math.max(a.length,b.length);
  if(a.length<2||b.length<2)return 0;
  const grams=new Map<string,number>();
  for(let i=0;i<a.length-1;i++)grams.set(a.slice(i,i+2),(grams.get(a.slice(i,i+2))??0)+1);
  let overlap=0;
  for(let i=0;i<b.length-1;i++){
    const gram=b.slice(i,i+2),count=grams.get(gram)??0;
    if(count>0){overlap++;grams.set(gram,count-1);}
  }
  return (2*overlap)/((a.length-1)+(b.length-1));
}

function isChordOnlyLine(line:string):boolean {
  const tokens=line.trim().replace(/[|,:()\-–—]/g," ").split(/\s+/).filter(Boolean);
  return tokens.length>0&&tokens.every(token=>CHORD_TOKEN.test(token));
}

function chordTokens(line:string):string[] {
  return line.trim().replace(/[|,:()\-–—]/g," ").split(/\s+/).filter(Boolean).filter(token=>CHORD_TOKEN.test(token));
}

function lyricLines(section:HymnSection):string[] {
  return section.lines.filter(line=>!isChordOnlyLine(line));
}

function parseChordRows(svg:string):ChordRow[] {
  const text=parseSvgText(svg);
  const sans=text.filter(item=>item.family.includes("sans-serif"));
  const roots=sans.filter(item=>/^[A-G]$/i.test(normalizeChordFragment(item.text)));
  const rootRows=clusterByY(roots,.24);
  const serifLyrics=text.filter(item=>item.family.includes("serif")&&!item.family.includes("sans-serif")&&item.fontSize>=2.25&&item.fontSize<=2.8);
  const lyricRows=clusterByY(serifLyrics,.24).map(group=>{
    const sorted=[...group].sort((a,b)=>a.x-b.x);
    const minX=sorted[0]?.x??0;
    const last=sorted.at(-1);
    const maxX=(last?.x??minX)+Math.max(1,(last?.text.length??1)*(last?.fontSize??2.4)*.45);
    return {y:group.reduce((sum,item)=>sum+item.y,0)/group.length,text:sorted.map(item=>item.text).join(" "),minX,maxX};
  });

  const rows:ChordRow[]=[];
  for(const rootRow of rootRows){
    const rowY=rootRow.reduce((sum,item)=>sum+item.y,0)/rootRow.length;
    const sortedRoots=[...rootRow].sort((a,b)=>a.x-b.x);
    const chords:Array<{chord:string;x:number}>=[];
    for(let i=0;i<sortedRoots.length;i++){
      const root=sortedRoots[i];
      const nextX=sortedRoots[i+1]?.x??Infinity;
      const maxX=Math.min(nextX-.05,root.x+7);
      const pieces=sans.filter(piece=>piece.x>=root.x-.05&&piece.x<maxX&&Math.abs(piece.y-root.y)<=1.55)
        .sort((a,b)=>a.x-b.x||Math.abs(a.y-root.y)-Math.abs(b.y-root.y));
      const compact=normalizeChordFragment(pieces.map(piece=>piece.text).join(""));
      if(likelyChord(compact))chords.push({chord:compact,x:root.x});
    }
    if(!chords.length)continue;
    const lyric=lyricRows
      .filter(candidate=>candidate.y-rowY>=4.5&&candidate.y-rowY<=13.5&&normalizeLyric(candidate.text).length>1)
      .sort((a,b)=>(a.y-rowY)-(b.y-rowY))[0];
    if(!lyric)continue;
    rows.push({y:rowY,chords,lyricText:lyric.text,lyricMinX:lyric.minX,lyricMaxX:lyric.maxX});
  }
  return rows.sort((a,b)=>a.y-b.y);
}

function mapRowAcrossLines(row:ChordRow,lineNorms:string[]):YpChordEvent[][] {
  const total=lineNorms.reduce((sum,line)=>sum+Math.max(1,line.length),0);
  const boundaries:number[]=[];
  let running=0;
  for(const line of lineNorms){running+=Math.max(1,line.length);boundaries.push(running/total);}
  const out=lineNorms.map(()=>[] as YpChordEvent[]);
  const width=Math.max(1,row.lyricMaxX-row.lyricMinX);
  for(const chord of row.chords){
    const absolute=Math.max(0,Math.min(.999,(chord.x-row.lyricMinX)/width));
    let lineIndex=boundaries.findIndex(boundary=>absolute<boundary);
    if(lineIndex<0)lineIndex=lineNorms.length-1;
    const start=lineIndex===0?0:boundaries[lineIndex-1];
    const end=boundaries[lineIndex]??1;
    const position=Math.max(0,Math.min(.98,(absolute-start)/Math.max(.001,end-start)));
    if(!out[lineIndex].some(event=>event.chord===chord.chord&&Math.abs(event.position-position)<.04))out[lineIndex].push({chord:chord.chord,position});
  }
  return out.map(events=>events.sort((a,b)=>a.position-b.position));
}

function propagatePatterns(mapped:YpChordEvent[][][],englishSections:HymnSection[],englishLyrics:string[][]){
  englishSections.forEach((section,sectionIndex)=>{
    mapped[sectionIndex].forEach((events,lineIndex)=>{
      if(events.length)return;
      const lineCount=englishLyrics[sectionIndex].length;
      const exact=englishSections.findIndex((candidate,candidateIndex)=>candidateIndex!==sectionIndex&&candidate.type===section.type&&englishLyrics[candidateIndex].length===lineCount&&mapped[candidateIndex]?.[lineIndex]?.length);
      const loose=exact>=0?exact:englishSections.findIndex((candidate,candidateIndex)=>candidateIndex!==sectionIndex&&candidate.type===section.type&&mapped[candidateIndex]?.[lineIndex]?.length);
      if(loose>=0)mapped[sectionIndex][lineIndex]=mapped[loose][lineIndex].map(event=>({...event}));
    });
  });
}

export function parseYpGuitarSvg(svg:string,englishSections:HymnSection[],myanmarSections:HymnSection[]):YpGuitarData {
  const englishLyrics=englishSections.map(section=>lyricLines(section));
  const mapped:YpChordEvent[][][]=englishLyrics.map(lines=>lines.map(()=>[]));

  // Local YP English pages often already contain chord-only lines. Those chord
  // names are the cleanest source, so preserve them and reuse their pattern.
  englishSections.forEach((section,sectionIndex)=>{
    let pending:string[]=[];
    let lyricIndex=0;
    for(const line of section.lines){
      if(isChordOnlyLine(line)){pending=chordTokens(line);continue;}
      if(pending.length&&mapped[sectionIndex]?.[lyricIndex]){
        mapped[sectionIndex][lyricIndex]=pending.map((chord,index)=>({chord,position:pending.length===1?0:index/(pending.length-.25)}));
      }
      pending=[];
      lyricIndex++;
    }
  });
  propagatePatterns(mapped,englishSections,englishLyrics);

  const candidates:Array<{sectionIndex:number;startLine:number;endLine:number;norm:string;lineNorms:string[]}>=[];
  englishLyrics.forEach((lines,sectionIndex)=>{
    for(let start=0;start<lines.length;start++){
      for(let span=1;span<=3&&start+span<=lines.length;span++){
        const lineNorms=lines.slice(start,start+span).map(normalizeLyric);
        candidates.push({sectionIndex,startLine:start,endLine:start+span-1,norm:lineNorms.join(""),lineNorms});
      }
    }
  });

  const remoteScores=englishLyrics.map(lines=>lines.map(()=>0));
  for(const row of parseChordRows(svg)){
    const rowNorm=normalizeLyric(row.lyricText);
    if(rowNorm.length<2)continue;
    let best:{candidate:(typeof candidates)[number];score:number}|undefined;
    for(const candidate of candidates){
      const score=diceScore(rowNorm,candidate.norm)-((candidate.endLine-candidate.startLine)*.015);
      if(!best||score>best.score)best={candidate,score};
    }
    if(!best||best.score<.54)continue;
    const placement=mapRowAcrossLines(row,best.candidate.lineNorms);
    placement.forEach((events,offset)=>{
      if(!events.length)return;
      const sectionIndex=best!.candidate.sectionIndex;
      const lineIndex=best!.candidate.startLine+offset;
      const target=mapped[sectionIndex]?.[lineIndex];
      if(!target||target.length)return;
      if(best!.score>remoteScores[sectionIndex][lineIndex]){
        mapped[sectionIndex][lineIndex]=events;
        remoteScores[sectionIndex][lineIndex]=best!.score;
      }
    });
  }

  // Printed lead sheets normally show the tune once. Reuse a clean pattern for
  // later stanzas and repeated refrains instead of accumulating duplicate rows.
  propagatePatterns(mapped,englishSections,englishLyrics);

  const output=myanmarSections.map((section,sectionIndex)=>{
    let englishIndex=sectionIndex;
    if(!englishSections[englishIndex]||englishSections[englishIndex].type!==section.type){
      const match=englishSections.findIndex(candidate=>candidate.type===section.type&&candidate.number===section.number);
      if(match>=0)englishIndex=match;
    }
    const source=mapped[englishIndex]??[];
    return {type:section.type,number:section.number,lines:section.lines.map((_,lineIndex)=>({chords:(source[lineIndex]??[]).map(event=>({...event}))}))};
  });

  const capoMatch=svg.match(/\(Guitar:\s*Capo\s*(\d+)\)/i);
  return {capo:capoMatch?Number(capoMatch[1]):0,sections:output};
}

export function ypGuitarHasChords(data:YpGuitarData):boolean {
  return data.sections.some(section=>section.lines.some(line=>line.chords.length>0));
}
