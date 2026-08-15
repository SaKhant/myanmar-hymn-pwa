"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Heart, Minus, Plus, Share2, X } from "lucide-react";
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

function shareFilename(hymn: ReaderHymn): string {
  const language = hymn.language === "my" ? "MY" : "ENG";
  return `${hymn.kind === "yp" ? "YP-" : ""}${language}-${hymn.number ?? hymn.id}.txt`;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function ReaderActions({ hymn }:{hymn:ReaderHymn}) {
  const defaultFontSize=hymn.language==="my"?21:20;
  const [favorites,setFavorites]=useState<StoredHymn[]>([]);
  const [fontSize,setFontSize]=useState(defaultFontSize);
  const [shareOpen,setShareOpen]=useState(false);
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
      setShareStatus("Native sharing is unavailable on this device. Use Copy text or Save text file instead.");
      return;
    }
    try { await navigator.share({title:hymn.title,text:shareText}); setShareOpen(false); }
    catch(error){
      if(error instanceof DOMException&&error.name==="AbortError")return;
      setShareStatus("Native sharing is unavailable on this device. Use Copy text or Save text file instead.");
    }
  };
  const copyPlainText=async()=>{await copyText(shareText);setShareStatus("Copied")};
  const saveTextFile=()=>{
    const file=new File([shareText],shareFilename(hymn),{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(file); const anchor=document.createElement("a"); anchor.href=url; anchor.download=file.name; anchor.click(); window.setTimeout(()=>URL.revokeObjectURL(url),0); setShareStatus("Saved");
  };

  return <>
    <div className="flex items-center gap-1.5"><button type="button" onClick={toggle} aria-label={favorite?"Remove favorite":"Add favorite"} className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--line)]"><Heart size={18} className={favorite?"fill-red-600 text-red-600":""}/></button><button type="button" onClick={()=>resize(-2)} aria-label="Smaller text" className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--line)]"><Minus size={17}/></button><span className="w-7 text-center text-xs font-semibold text-[var(--muted)]">{fontSize}</span><button type="button" onClick={()=>resize(2)} aria-label="Larger text" className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--line)]"><Plus size={17}/></button><button type="button" onClick={()=>{setShareStatus("");setShareOpen(true)}} aria-label="Share" className="focus-ring ml-auto grid size-10 place-items-center rounded-full border border-[var(--line)]"><Share2 size={17}/></button></div>
    {shareOpen&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center" onClick={()=>setShareOpen(false)}><section role="dialog" aria-modal="true" aria-label="Share song" className="surface w-full max-w-sm rounded-2xl p-4" onClick={event=>event.stopPropagation()}><div className="mb-3 flex items-center"><h2 className="font-serif text-xl">Share as text</h2><button type="button" onClick={()=>setShareOpen(false)} aria-label="Close share menu" className="focus-ring ml-auto grid size-9 place-items-center rounded-lg"><X size={18}/></button></div><div className="grid gap-1"><button type="button" onClick={sharePlainText} className="focus-ring flex min-h-12 items-center gap-3 rounded-xl px-3 text-left font-semibold hover:bg-[var(--sage-soft)]"><Share2 size={18}/>Share text</button><button type="button" onClick={copyPlainText} className="focus-ring flex min-h-12 items-center gap-3 rounded-xl px-3 text-left font-semibold hover:bg-[var(--sage-soft)]"><Copy size={18}/>Copy text</button><button type="button" onClick={saveTextFile} className="focus-ring flex min-h-12 items-center gap-3 rounded-xl px-3 text-left font-semibold hover:bg-[var(--sage-soft)]"><Download size={18}/>Save text file</button></div>{shareStatus&&<p role="status" className="mt-3 flex items-center gap-2 px-3 text-sm font-bold text-[var(--sage)]"><Check size={16}/>{shareStatus}</p>}</section></div>}
  </>;
}
