"use client";

import { useState } from "react";
import type { HymnSection } from "@/lib/hymns/types";

type ReaderMode="lyrics"|"guitar";
type ChordEvent={chord:string;position:number};
type GuitarPayload={sourceLabel:string;capo:number|null;sections:Array<{type:string;number:number|null;lines:Array<{chords:ChordEvent[]}>}>};

const chordSentenceStyle={display:"block",maxWidth:"100%",minWidth:0,whiteSpace:"normal",lineHeight:2.55,paddingTop:".9em"} as const;
const chordAnchorStyle={position:"relative",display:"inline"} as const;
const chordLabelStyle={position:"absolute",left:0,top:"-1.05em",zIndex:1,whiteSpace:"nowrap",pointerEvents:"none"} as const;
const flowingLyricStyle={display:"inline",whiteSpace:"normal",overflowWrap:"normal",wordBreak:"normal"} as const;

export function RemoteHymnGuitarReader({sections,hymnNumber,sourceLabel}:{sections:HymnSection[];hymnNumber:number;sourceLabel:string}){
  const [mode,setMode]=useState<ReaderMode>("lyrics");
  const [guitar,setGuitar]=useState<GuitarPayload|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);

  async function showGuitar(){
    setMode("guitar");
    if(guitar||loading)return;
    setLoading(true);
    setError(null);
    try {
      const response=await fetch(`/api/hymn-guitar/${hymnNumber}`);
      if(!response.ok)throw new Error("Structured guitar chords are not available for this hymn.");
      setGuitar(await response.json() as GuitarPayload);
    } catch (reason) {
      setError(reason instanceof Error?reason.message:"Unable to load guitar chords.");
    } finally {
      setLoading(false);
    }
  }

  return <>
    <div className="reader-mode-switch" role="group" aria-label="Reader display mode">
      <button type="button" aria-pressed={mode==="lyrics"} onClick={()=>setMode("lyrics")}>Lyrics</button>
      <button type="button" aria-pressed={mode==="guitar"} onClick={showGuitar}>Guitar</button>
    </div>

    {mode==="lyrics"?<LyricsView sections={sections}/>:loading?<LoadingGuitar/>:guitar?<StructuredGuitarView sections={sections} guitar={guitar} sourceLabel={sourceLabel}/>:<UnavailableGuitar message={error}/>} 
  </>;
}

function LyricsView({sections}:{sections:HymnSection[]}){
  return <div className="mx-auto max-w-2xl py-7 reader-lyrics-myanmar">
    {sections.map((section,index)=>{
      const chorus=section.type==="chorus"||section.type==="refrain";
      return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus?"border-l-2 border-[color-mix(in_srgb,var(--gold)_72%,transparent)] pl-4":""}`}>
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type==="verse"?`Verse ${section.number??""}`:section.type}</p>
        <div className="myanmar">{section.lines.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}</div>
      </section>;
    })}
  </div>;
}

function LoadingGuitar(){
  return <div className="mx-auto max-w-2xl py-10 text-center text-sm font-semibold text-[var(--muted)]">Loading guitar chords…</div>;
}

function UnavailableGuitar({message}:{message:string|null}){
  return <div className="mx-auto max-w-2xl py-10 text-center text-sm font-semibold text-[var(--muted)]">{message??"Structured guitar chords are not available for this hymn."}</div>;
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
  const chars=graphemes(text);
  if(!chars.length)return [{text}];
  const grouped=new Map<number,string[]>();
  for(const event of [...chords].sort((a,b)=>a.position-b.position)){
    const index=Math.max(0,Math.min(chars.length-1,Math.round(event.position*Math.max(1,chars.length-1))));
    const list=grouped.get(index)??[];
    if(!list.includes(event.chord))list.push(event.chord);
    grouped.set(index,list);
  }
  const indices=[...grouped.keys()].sort((a,b)=>a-b);
  const segments:Array<{text:string;chord?:string}>=[];
  if(indices[0]>0)segments.push({text:chars.slice(0,indices[0]).join("")});
  indices.forEach((start,index)=>{
    const end=indices[index+1]??chars.length;
    segments.push({text:chars.slice(start,end).join(""),chord:(grouped.get(start)??[]).join(" ")});
  });
  return segments;
}

function StructuredGuitarView({sections,guitar,sourceLabel}:{sections:HymnSection[];guitar:GuitarPayload;sourceLabel:string}){
  return <div className="guitar-view" style={{minWidth:0,overflowX:"hidden"}}>
    <div className="guitar-info" aria-label={`Guitar chords from ${sourceLabel}${guitar.capo?`, capo ${guitar.capo}`:""}`}>
      <span>Source <strong>{sourceLabel}</strong></span>
      {guitar.capo!==null&&guitar.capo>0&&<><i aria-hidden="true">•</i><span>Capo <strong>{guitar.capo}</strong></span></>}
    </div>

    {sections.map((section,sectionIndex)=>{
      const chorus=section.type==="chorus"||section.type==="refrain";
      const verse=section.type==="verse";
      const guitarSection=guitar.sections[sectionIndex];
      return <section key={`${section.type}-${section.number}-${sectionIndex}`} className={`guitar-verse ${chorus?"pl-6":""}`} style={verse?{paddingLeft:0}:undefined}>
        {verse?<div className="mb-[.65rem] flex min-h-7 items-center">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e2e2] text-[.8rem] font-normal leading-none text-[#4b5563]" style={{fontFamily:"Arial, sans-serif"}} aria-label={`Verse ${section.number??sectionIndex+1}`}>{section.number??sectionIndex+1}</span>
        </div>:!chorus?<p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type}</p>:null}
        <div className="myanmar">
          {section.lines.map((line,lineIndex)=>{
            const chords=guitarSection?.lines[lineIndex]?.chords??[];
            const segments=splitLine(line,chords);
            return <div className="guitar-line" key={lineIndex} style={{minWidth:0,maxWidth:"100%",marginBottom:0}}>
              <div className="guitar-phrase guitar-sentence-line" style={chordSentenceStyle}>
                {segments.map((segment,segmentIndex)=><span className="guitar-segment" key={segmentIndex} style={chordAnchorStyle}>
                  {segment.chord&&<span className="guitar-chord" style={chordLabelStyle} aria-label={`Chord ${segment.chord}`}>{segment.chord}</span>}
                  <span className="guitar-lyric-segment" style={flowingLyricStyle}>{segment.text}</span>
                </span>)}
              </div>
            </div>;
          })}
        </div>
      </section>;
    })}
  </div>;
}
