"use client";

import { useEffect, useState } from "react";
import { GuitarReader } from "@/components/guitar-reader";
import type { GuitarArrangement } from "@/lib/hymns/guitar-types";
import type { OfflineHymn } from "@/lib/offline-library";

function PlainLyricsFallback({hymn}:{hymn:OfflineHymn}){
  return <div className="mx-auto max-w-2xl py-7 reader-lyrics-myanmar">{hymn.sections.map((section,index)=>{const chorus=section.type==="chorus"||section.type==="refrain";return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus?"border-l-2 border-[color-mix(in_srgb,var(--gold)_72%,transparent)] pl-4":""}`}><p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type==="verse"?`Verse ${section.number??""}`:section.type}</p><div className="myanmar">{section.lines.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}</div></section>})}</div>;
}

export function OfflineGuitarReader({hymn}:{hymn:OfflineHymn}){
  const [arrangement,setArrangement]=useState<GuitarArrangement|null|undefined>(undefined);
  useEffect(()=>{
    let active=true;
    void import("@/lib/hymns/guitar-data").then(module=>{
      if(active)setArrangement(module.getGuitarArrangement(hymn)??null);
    }).catch(()=>{if(active)setArrangement(null)});
    return()=>{active=false};
  },[hymn]);
  if(arrangement)return <GuitarReader sections={hymn.sections} arrangement={arrangement} numberedNotesImageSrc={hymn.number===1?"/jianpu/myanmar-hymn-1.png":undefined}/>;
  if(arrangement===null)return <PlainLyricsFallback hymn={hymn}/>;
  return null;
}
