"use client";

import { useState } from "react";
import type { HymnSection } from "@/lib/hymns/types";

type ReaderMode="lyrics"|"guitar";

export function YpGuitarReader({sections,guitarSheetSrc,sourceLabel}:{sections:HymnSection[];guitarSheetSrc:string;sourceLabel:string}){
  const [mode,setMode]=useState<ReaderMode>("lyrics");

  return <>
    <div className="reader-mode-switch" role="group" aria-label="Reader display mode">
      <button type="button" aria-pressed={mode==="lyrics"} onClick={()=>setMode("lyrics")}>Lyrics</button>
      <button type="button" aria-pressed={mode==="guitar"} onClick={()=>setMode("guitar")}>Guitar</button>
    </div>

    {mode==="lyrics"?<LyricsView sections={sections}/>:<GuitarSheetView sections={sections} guitarSheetSrc={guitarSheetSrc} sourceLabel={sourceLabel}/>} 
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

function GuitarSheetView({sections,guitarSheetSrc,sourceLabel}:{sections:HymnSection[];guitarSheetSrc:string;sourceLabel:string}){
  return <div className="mx-auto max-w-2xl py-5">
    <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-[var(--muted)]">
      <span>Hymnal.net Guitar</span>
      <span className="rounded-full border border-[var(--line)] px-2.5 py-1 font-bold text-[var(--ink)]">{sourceLabel}</span>
    </div>

    <div className="overflow-auto rounded-xl border border-[var(--line)] bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
      <img src={guitarSheetSrc} alt={`${sourceLabel} guitar lead sheet`} className="block h-auto w-full min-w-[44rem]" draggable={false}/>
    </div>
    <p className="mt-2 text-center text-[11px] font-medium text-[var(--muted)]">Exact guitar lead sheet from Hymnal.net. Scroll sideways on a small screen.</p>

    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <p className="mb-5 text-xs font-extrabold uppercase tracking-[.12em] text-[var(--gold)]">Myanmar lyrics</p>
      <div className="reader-lyrics-myanmar">
        {sections.map((section,index)=>{
          const verse=section.type==="verse";
          const chorus=section.type==="chorus"||section.type==="refrain";
          return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus?"pl-6":""}`}>
            {verse?<div className="mb-[.65rem] flex min-h-7 items-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e2e2] text-[.8rem] font-normal leading-none text-[#4b5563]" style={{fontFamily:"Arial, sans-serif"}} aria-label={`Verse ${section.number??index+1}`}>{section.number??index+1}</span>
            </div>:!chorus?<p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type}</p>:null}
            <div className="myanmar">{section.lines.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}</div>
          </section>;
        })}
      </div>
    </div>
  </div>;
}
