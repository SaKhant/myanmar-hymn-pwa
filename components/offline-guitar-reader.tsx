"use client";

import { GuitarReader } from "@/components/guitar-reader";
import { getGuitarArrangement } from "@/lib/hymns/guitar-data";
import type { OfflineHymn } from "@/lib/offline-library";

export function OfflineGuitarReader({hymn}:{hymn:OfflineHymn}){
  const arrangement=getGuitarArrangement(hymn);
  if(!arrangement)return <div className="mx-auto max-w-2xl py-7 reader-lyrics-myanmar">{hymn.sections.map((section,index)=>{const chorus=section.type==="chorus"||section.type==="refrain";return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus?"border-l-2 border-[color-mix(in_srgb,var(--gold)_72%,transparent)] pl-4":""}`}><p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type==="verse"?`Verse ${section.number??""}`:section.type}</p><div className="myanmar">{section.lines.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}</div></section>})}</div>;
  return <GuitarReader sections={hymn.sections} arrangement={arrangement} numberedNotesImageSrc={hymn.number===1?"/jianpu/myanmar-hymn-1.png":undefined}/>;
}
