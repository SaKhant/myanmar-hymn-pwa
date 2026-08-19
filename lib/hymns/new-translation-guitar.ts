import "server-only";
import type { HymnSection } from "./types";
import type { YpChordEvent,YpGuitarData } from "./yp-guitar";

type SvgText={x:number;y:number;family:string;fontSize:number;text:string};
type LyricRow={y:number;minX:number;maxX:number;text:string};

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

function parseSvgText(svg:string):SvgText[]{
  const elements:SvgText[]=[];
  const re=/<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match:RegExpExecArray|null;
  while((match=re.exec(svg))){
    const attrs=match[1];
    const transform=attr(attrs,"transform")?.match(/translate\(\s*([-\d.]+)\s*,?\s+([-\d.]+)\s*\)/);
    if(!transform)continue;
    const body=match[2];
    const tspans=[...body.matchAll(/<tspan[^>]*>([\s\S]*?)<\/tspan>/g)].map(item=>decodeXml(item[1].replace(/<[^>]+>/g,"")));
    const text=(tspans.length?tspans.join(""):decodeXml(body.replace(/<[^>]+>/g,""))).trim();
    if(!text)continue;
    elements.push({x:Number(transform[1]),y:Number(transform[2]),family:attr(attrs,"font-family")??"",fontSize:Number(attr(attrs,"font-size")??0),text});
  }
  return elements;
}

function clusterByY<T extends {y:number}>(items:T[],tolerance=.24):T[][]{
  const groups:T[][]=[];
  for(const item of [...items].sort((a,b)=>a.y-b.y)){
    const group=groups.find(candidate=>Math.abs(candidate[0].y-item.y)<=tolerance);
    if(group)group.push(item);else groups.push([item]);
  }
  return groups;
}

function normalizeChordFragment(text:string):string {
  return text.trim().replace(/♭/g,"b").replace(/♯/g,"#").replace(/\s+/g,"");
}

function likelyChord(value:string):boolean {
  return value.length>=1&&value.length<=14&&/^[A-G](?:#|b)?[A-Za-z0-9#b/+()°øΔ-]*$/.test(value);
}

function lyricRows(text:SvgText[]):LyricRow[]{
  const items=text.filter(item=>item.family.includes("serif")&&!item.family.includes("sans-serif")&&item.fontSize>=2.25&&item.fontSize<=2.8);
  return clusterByY(items).map(group=>{
    const sorted=[...group].sort((a,b)=>a.x-b.x);
    const first=sorted[0];const last=sorted.at(-1);
    const minX=first?.x??0;
    const maxX=(last?.x??minX)+Math.max(1,(last?.text.length??1)*(last?.fontSize??2.4)*.45);
    return {y:group.reduce((sum,item)=>sum+item.y,0)/group.length,minX,maxX,text:sorted.map(item=>item.text).join(" ")};
  }).filter(row=>row.text.trim().length>0).sort((a,b)=>a.y-b.y);
}

function linePatterns(svg:string):YpChordEvent[][]{
  const text=parseSvgText(svg);
  const lyrics=lyricRows(text);
  const sans=text.filter(item=>item.family==="sans"||item.family.includes("sans-serif"));
  const roots=sans.filter(item=>/^[A-G]$/i.test(normalizeChordFragment(item.text)));
  const rootRows=clusterByY(roots).map(group=>({y:group.reduce((sum,item)=>sum+item.y,0)/group.length,roots:[...group].sort((a,b)=>a.x-b.x)}));

  return lyrics.map(lyric=>{
    const rootRow=rootRows.filter(row=>lyric.y-row.y>=4.5&&lyric.y-row.y<=13.5).sort((a,b)=>(lyric.y-a.y)-(lyric.y-b.y))[0];
    if(!rootRow)return [];
    const width=Math.max(1,lyric.maxX-lyric.minX);
    const events:YpChordEvent[]=[];
    for(let index=0;index<rootRow.roots.length;index++){
      const root=rootRow.roots[index];
      const nextX=rootRow.roots[index+1]?.x??Infinity;
      const maxX=Math.min(nextX-.05,root.x+7);
      const pieces=sans.filter(piece=>piece.x>=root.x-.05&&piece.x<maxX&&Math.abs(piece.y-root.y)<=1.55)
        .sort((a,b)=>a.x-b.x||Math.abs(a.y-root.y)-Math.abs(b.y-root.y));
      const chord=normalizeChordFragment(pieces.map(piece=>piece.text).join(""));
      if(!likelyChord(chord))continue;
      const position=Math.max(0,Math.min(.98,(root.x-lyric.minX)/width));
      if(!events.some(event=>event.chord===chord&&Math.abs(event.position-position)<.04))events.push({chord,position});
    }
    return events.sort((a,b)=>a.position-b.position);
  });
}

export function parseTranslationLeadSheetByShape(svg:string,myanmarSections:HymnSection[]):YpGuitarData {
  const patterns=linePatterns(svg);
  const output=myanmarSections.map(section=>({type:section.type,number:section.number,lines:section.lines.map(()=>({chords:[] as YpChordEvent[]}))}));
  const verseIndices=myanmarSections.map((section,index)=>section.type==="verse"?index:-1).filter(index=>index>=0);
  const firstVerseIndex=verseIndices[0]??-1;

  if(firstVerseIndex<0){
    const total=myanmarSections.reduce((sum,section)=>sum+section.lines.length,0);
    if(total>0&&patterns.length===total){
      let cursor=0;
      output.forEach(section=>section.lines.forEach(line=>{line.chords=(patterns[cursor++]??[]).map(event=>({...event}));}));
    }
  }else{
    const introCount=myanmarSections.slice(0,firstVerseIndex).reduce((sum,section)=>sum+section.lines.length,0);
    const firstCount=myanmarSections[firstVerseIndex].lines.length;
    let versePatternStart=0;
    let safeVerse=false;

    if(firstCount>0&&patterns.length>=introCount+firstCount){
      let cursor=0;
      for(let index=0;index<firstVerseIndex;index++)output[index].lines.forEach(line=>{line.chords=(patterns[cursor++]??[]).map(event=>({...event}));});
      versePatternStart=cursor;safeVerse=true;
    }else if(firstCount>0&&patterns.length>=firstCount){
      safeVerse=true;
    }

    if(safeVerse){
      for(const index of verseIndices){
        output[index].lines.forEach((line,lineIndex)=>{
          if(lineIndex<firstCount)line.chords=(patterns[versePatternStart+lineIndex]??[]).map(event=>({...event}));
        });
      }
    }
  }

  const capoMatch=svg.match(/\(Guitar:\s*Capo\s*(\d+)\)/i);
  return {capo:capoMatch?Number(capoMatch[1]):0,sections:output};
}
