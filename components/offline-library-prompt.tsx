"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { downloadOfflineLibrary, readOfflineLibraryMeta } from "@/lib/offline-library";

const DISMISSED_KEY="hymn-house:offline-prompt-dismissed";

export function OfflineLibraryPrompt(){
  const [visible,setVisible]=useState(false),[status,setStatus]=useState<"idle"|"downloading"|"ready"|"error">("idle"),[progress,setProgress]=useState<number|null>(null);
  useEffect(()=>{let active=true;readOfflineLibraryMeta().then(meta=>{if(active&&!meta&&localStorage.getItem(DISMISSED_KEY)!=="true")setVisible(true)}).catch(()=>{});return()=>{active=false}},[]);
  if(!visible)return null;
  const dismiss=()=>{localStorage.setItem(DISMISSED_KEY,"true");setVisible(false)};
  const download=async()=>{setStatus("downloading");setProgress(null);try{await downloadOfflineLibrary((received,total)=>setProgress(total?Math.min(100,Math.round(received/total*100)):null));setStatus("ready");window.setTimeout(()=>setVisible(false),900)}catch{setStatus("error")}};
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="offline-prompt-title" className="surface w-full max-w-md p-5">
      <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--sage-soft)] text-[var(--sage)]"><Download size={19}/></div><div><h2 id="offline-prompt-title" className="font-serif text-xl">Download hymn library for offline use?</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Keep hymn and song text available without internet. Includes Myanmar Hymns, English references, YP Songs, Categories, and metadata. Audio is not downloaded.</p></div><button type="button" onClick={dismiss} aria-label="Not now" className="focus-ring ml-auto grid size-9 shrink-0 place-items-center rounded-lg"><X size={17}/></button></div>
      {status==="downloading"&&<p className="mt-4 text-sm font-bold text-[var(--sage)]">Downloading hymn library{progress!==null?`… ${progress}%`:"…"}</p>}
      {status==="ready"&&<p className="mt-4 text-sm font-bold text-[var(--sage)]">Offline library ready ✓</p>}
      {status==="error"&&<p className="mt-4 text-sm font-bold text-[var(--active-red)]">Download failed. Check your connection and try again.</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={dismiss} disabled={status==="downloading"} className="focus-ring min-h-11 rounded-xl px-4 text-sm font-bold text-[var(--muted)]">Not now</button><button type="button" onClick={download} disabled={status==="downloading"||status==="ready"} className="focus-ring min-h-11 rounded-xl bg-[var(--sage)] px-5 text-sm font-bold text-white disabled:opacity-60">{status==="error"?"Retry":"Download"}</button></div>
    </section>
  </div>;
}

