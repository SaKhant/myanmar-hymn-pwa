"use client";

import { useState } from "react";
import type { TranslationDisplaySection } from "@/lib/hymns/translation-display";

type ReaderMode="lyrics"|"guitar";
type ChordEvent={chord:string;position:number};
type GuitarPayload={sourceLabel:string;capo:number|null;sections:Array<{type:string;number:number|null;lines:Array<{chords:ChordEvent[]}>}>};

const chordSentenceStyle={display:"block",maxWidth:"100%",minWidth:0,whiteSpace:"normal",lineHeight:2.55,paddingTop:".9em"} as const;
const chordAnchorStyle={position:"relative",display:"inline"} as const;
const chordLabelStyle={position:"absolute",left:0,top:"-1.05em",zIndex:1,whiteSpace:"nowrap",pointerEvents:"none"} as const;
const flowingLyricStyle={display:"inline",whiteSpace:"normal",overflowWrap:"normal",wordBreak:"normal"} as const;

export function TranslationGuitarReader({sections,apiUrl,sourceLabel}:{sections:TranslationDisplaySection[];apiUrl:string;sourceLabel:string}){
  const [mode,setMode]=useState<ReaderMode>("lyrics");
  const [guitar,setGuitar]=useState<GuitarPayload|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);

  async function showGuitar(){
    setMode("guitar");
    if(guitar||loading)return;
    setLoading(true);setError(null);
    try{
      const response=await fetch(apiUrl);
      if(!response.ok)throw new Error("Structured guitar chords are not available for this song.");
      setGuitar(await response.json() as GuitarPayload);
    }catch(reason){
      setError(reason instanceof Error?reason.message:"Unable to load guitar chords.");
    }finally{setLoading(false);}
  }

  return <>
    <div className="reader-mode-switch" role="group" aria-label="Reader display mode">
      <button type="button" aria-pressed={mode==="lyrics"} onClick={()=>setMode("lyrics")}>Lyrics</button>
      <button type="button" aria-pressed={mode==="guitar"} onClick={showGuitar}>Guitar</button>
    </div>
    {mode==="lyrics"?<TranslationLyrics sections={sections}/>:loading?<Status>Loading guitar chords…</Status>:guitar?<TranslationGuitar sections={sections} guitar={guitar} sourceLabel={sourceLabel}/>:<Status>{error??"Structured guitar chords are not available for this song."}</Status>}
  </>;
}

function Status({children}:{children:React.ReactNode}){
  return <div className="mx-auto max-w-2xl py-10 text-center text-sm font-semibold text-[var(--muted)]">{children}</div>;
}

function commonVerseIndent(section:TranslationDisplaySection):number{
  if(section.number===null)return 0;
  const counts=new Map<number,number>();
  for(const line of section.lines){
    if(line.kind!=="lyric"||line.indent<=0)continue;
    counts.set(line.indent,(counts.get(line.indent)??0)+1);
  }
  let bestIndent=0,bestCount=0;
  for(const [indent,count] of counts){
    if(count>bestCount||(count===bestCount&&indent<bestIndent)){bestIndent=indent;bestCount=count;}
  }
  return bestIndent;
}

function displayIndent(section:TranslationDisplaySection,line:TranslationDisplaySection["lines"][number]):number{
  if(line.kind!=="lyric"||section.number===null)return line.indent;
  return Math.max(0,line.indent-commonVerseIndent(section));
}

function TranslationLyrics({sections}:{sections:TranslationDisplaySection[]}){
  return <div className="mx-auto max-w-2xl py-7 reader-lyrics-myanmar">
    {sections.map((section,sectionIndex)=><section key={`${section.number??"text"}-${sectionIndex}`} className="mb-7 last:mb-0">
      {section.number!==null?<VerseBadge number={section.number}/>:null}
      <div className="myanmar">{section.lines.map((line,lineIndex)=><DisplayLine line={line} indent={displayIndent(section,line)} key={lineIndex}/>)}</div>
    </section>)}
  </div>;
}

function VerseBadge({number}:{number:number}){
  return <div className="mb-[.65rem] flex min-h-7 items-center"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e2e2] text-[.8rem] font-normal leading-none text-[#4b5563]" style={{fontFamily:"Arial, sans-serif"}} aria-label={`Verse ${number}`}>{number}</span></div>;
}

function DisplayLine({line,indent=line.indent}:{line:TranslationDisplaySection["lines"][number];indent?:number}){
  if(line.kind==="blank")return <div className="h-3"/>;
  const muted=line.kind==="repeat"||line.kind==="ellipsis";
  return <div style={indent?{paddingLeft:`${indent*1.5}rem`}:undefined} className={muted?"text-[var(--muted)]":""}>{line.text}</div>;
}

function graphemes(text:string):string[]{
  if(typeof Intl!=="undefined"&&"Segmenter" in Intl){
    const segmenter=new Intl.Segmenter("my",{granularity:"grapheme"});
    return Array.from(segmenter.segment(text),part=>part.segment);
  }
  return Array.from(text);
}

function splitLine(text:string,chords:ChordEvent[]):Array<{text:string;chord?:string}>{
  if(!chords.length)return [{text}];
  const chars=graphemes(text);if(!chars.length)return [{text}];
  const grouped=new Map<number,string[]>();
  for(const event of [...chords].sort((a,b)=>a.position-b.position)){
    const index=Math.max(0,Math.min(chars.length-1,Math.round(event.position*Math.max(1,chars.length-1))));
    const list=grouped.get(index)??[];if(!list.includes(event.chord))list.push(event.chord);grouped.set(index,list);
  }
  const indices=[...grouped.keys()].sort((a,b)=>a-b);const segments:Array<{text:string;chord?:string}>=[];
  if(indices[0]>0)segments.push({text:chars.slice(0,indices[0]).join("")});
  indices.forEach((start,index)=>{const end=indices[index+1]??chars.length;segments.push({text:chars.slice(start,end).join(""),chord:(grouped.get(start)??[]).join(" ")});});
  return segments;
}

function TranslationGuitar({sections,guitar,sourceLabel}:{sections:TranslationDisplaySection[];guitar:GuitarPayload;sourceLabel:string}){
  return <div className="guitar-view" style={{minWidth:0,overflowX:"hidden"}}>
    <div className="guitar-info" aria-label={`Guitar chords from ${sourceLabel}${guitar.capo?`, capo ${guitar.capo}`:""}`}>
      <span>Source <strong>{sourceLabel}</strong></span>{guitar.capo!==null&&guitar.capo>0&&<><i aria-hidden="true">•</i><span>Capo <strong>{guitar.capo}</strong></span></>}
    </div>
    {sections.map((section,sectionIndex)=><section key={`${section.number??"text"}-${sectionIndex}`} className="guitar-verse" style={{paddingLeft:0}}>
      {section.number!==null?<VerseBadge number={section.number}/>:null}
      <div className="myanmar">{section.lines.map((line,lineIndex)=>{
        const indent=displayIndent(section,line);
        if(line.kind!=="lyric")return <DisplayLine line={line} indent={indent} key={lineIndex}/>;
        const chords=guitar.sections[sectionIndex]?.lines[lineIndex]?.chords??[];
        const segments=splitLine(line.text,chords);
        return <div className="guitar-line" key={lineIndex} style={{minWidth:0,maxWidth:"100%",marginBottom:0,paddingLeft:indent?`${indent*1.5}rem`:undefined}}>
          <div className="guitar-phrase guitar-sentence-line" style={chordSentenceStyle}>{segments.map((segment,segmentIndex)=><span className="guitar-segment" key={segmentIndex} style={chordAnchorStyle}>{segment.chord&&<span className="guitar-chord" style={chordLabelStyle} aria-label={`Chord ${segment.chord}`}>{segment.chord}</span>}<span className="guitar-lyric-segment" style={flowingLyricStyle}>{segment.text}</span></span>)}</div>
        </div>;
      })}</div>
    </section>)}
  </div>;
}
