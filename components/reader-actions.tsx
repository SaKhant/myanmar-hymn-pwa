"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Minus, Plus, Share2 } from "lucide-react";
import type { HymnSection } from "@/lib/hymns/types";
import { FAVORITES_KEY, FONT_SIZE_KEY, readStored, writeStored, type StoredHymn } from "@/lib/storage";

type ReaderHymn = StoredHymn & { sections: HymnSection[] };

function sectionLabel(section: HymnSection): string {
  if (section.type === "verse") return `Verse ${section.number ?? ""}`.trim();
  if (section.type === "chorus") return "Chorus";
  if (section.type === "refrain") return "Refrain";
  return section.type.charAt(0).toUpperCase() + section.type.slice(1);
}

function formatShareText(hymn: ReaderHymn): string {
  const language = hymn.language === "my" ? "MY" : "ENG";
  const heading = `${hymn.kind === "yp" ? "YP " : ""}${language} ${hymn.number ?? hymn.id}`;
  const sections = hymn.sections.map(section => `${sectionLabel(section)}\n${section.lines.join("\n")}`).join("\n\n");
  return `${heading}\n\n${hymn.title}\n\n${sections}`.trim();
}

export function ReaderActions({ hymn }:{hymn:ReaderHymn}) {
  const defaultFontSize=hymn.language==="my"?21:20;
  const [favorites,setFavorites]=useState<StoredHymn[]>([]);
  const [fontSize,setFontSize]=useState(defaultFontSize);
  const [shareStatus,setShareStatus]=useState("");
  const key=`${hymn.kind}-${hymn.language}-${hymn.id}`;
  const shareText=useMemo(()=>formatShareText(hymn),[hymn]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{ setFavorites(readStored<StoredHymn[]>(FAVORITES_KEY,[])); setFontSize(readStored(FONT_SIZE_KEY,defaultFontSize)); },[defaultFontSize]);
  const favorite=favorites.some(x=>`${x.kind}-${x.language}-${x.id}`===key);
  const toggle=()=>{ const storedHymn:StoredHymn={id:hymn.id,kind:hymn.kind,language:hymn.language,number:hymn.number,title:hymn.title}; const next=favorite?favorites.filter(x=>`${x.kind}-${x.language}-${x.id}`!==key):[storedHymn,...favorites]; setFavorites(next); writeStored(FAVORITES_KEY,next); };
  const resize=(delta:number)=>{ const next=Math.max(16,Math.min(32,fontSize+delta)); setFontSize(next); writeStored(FONT_SIZE_KEY,next); document.documentElement.style.setProperty("--lyric-size",`${next}px`); };
  useEffect(()=>document.documentElement.style.setProperty("--lyric-size",`${fontSize}px`),[fontSize]);

  const sharePlainText=async()=>{
    if(!navigator.share){
      setShareStatus("Native sharing is unavailable on this device.");
      return;
    }
    try { await navigator.share({title:hymn.title,text:shareText}); setShareStatus(""); }
    catch(error){
      if(error instanceof DOMException&&error.name==="AbortError")return;
      setShareStatus("Native sharing is unavailable on this device.");
    }
  };

  return <>
    <div className="flex items-center gap-1.5"><button type="button" onClick={toggle} aria-label={favorite?"Remove favorite":"Add favorite"} className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--line)]"><Heart size={18} className={favorite?"fill-red-600 text-red-600":""}/></button><button type="button" onClick={()=>resize(-2)} aria-label="Smaller text" className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--line)]"><Minus size={17}/></button><span className="w-7 text-center text-xs font-semibold text-[var(--muted)]">{fontSize}</span><button type="button" onClick={()=>resize(2)} aria-label="Larger text" className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--line)]"><Plus size={17}/></button><button type="button" onClick={()=>{setShareStatus("");void sharePlainText()}} aria-label="Share" className="focus-ring ml-auto grid size-10 place-items-center rounded-full border border-[var(--line)]"><Share2 size={17}/></button></div>
    {shareStatus&&<p role="status" className="mt-2 text-right text-xs font-bold text-[var(--muted)]">{shareStatus}</p>}
  </>;
}
