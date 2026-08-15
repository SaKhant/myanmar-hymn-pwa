"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, RefreshCw, WifiOff } from "lucide-react";
import { downloadOfflineLibrary, getAvailableOfflineLibraryVersion, readOfflineLibraryMeta, type OfflineLibraryMeta } from "@/lib/offline-library";

function formatSize(bytes:number){return bytes>=1024*1024?`${(bytes/1024/1024).toFixed(1)} MB`:`${Math.max(1,Math.round(bytes/1024))} KB`}
function formatDate(value:string){try{return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}catch{return value}}

export function OfflineLibrarySettings(){
  const [meta,setMeta]=useState<OfflineLibraryMeta|null>(null),[online,setOnline]=useState(true),[state,setState]=useState<"idle"|"checking"|"downloading"|"error">("idle"),[message,setMessage]=useState(""),[availableVersion,setAvailableVersion]=useState<string|null>(null),[progress,setProgress]=useState<number|null>(null);
  useEffect(()=>{let active=true;readOfflineLibraryMeta().then(value=>{if(active)setMeta(value)}).catch(()=>{});const sync=()=>setOnline(navigator.onLine);sync();window.addEventListener("online",sync);window.addEventListener("offline",sync);return()=>{active=false;window.removeEventListener("online",sync);window.removeEventListener("offline",sync)}},[]);
  const updateAvailable=Boolean(meta&&availableVersion&&availableVersion!==meta.version);
  const download=async()=>{setState("downloading");setMessage("");setProgress(null);try{const value=await downloadOfflineLibrary((received,total)=>setProgress(total?Math.min(100,Math.round(received/total*100)):null));setMeta(value);setAvailableVersion(value.version);setMessage("Offline library ready ✓");setState("idle")}catch{setMessage("Download failed. Check your connection and try again.");setState("error")}};
  const check=async()=>{setState("checking");setMessage("");try{const available=await getAvailableOfflineLibraryVersion();setAvailableVersion(available.version);setMessage(meta&&available.version!==meta.version?"Update available":"Your offline library is up to date.");setState("idle")}catch{setMessage("Could not check for updates.");setState("error")}};
  return <section className="surface mt-8 p-6">
    <div className="flex items-start gap-3">{meta?<CheckCircle2 className="mt-0.5 shrink-0 text-[var(--sage)]" size={21}/>:<Download className="mt-0.5 shrink-0 text-[var(--sage)]" size={21}/>}<div><h2 className="font-serif text-2xl">Offline Library</h2><p className="mt-1 text-sm font-bold">{meta?"Downloaded ✓":"Not downloaded"}</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Hymn and song text, categories, metadata, and MY / ENG references. Audio remains online-only.</p></div></div>
    {meta&&<dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-[var(--muted)]">Library version</dt><dd className="font-bold">{meta.version}{updateAvailable&&<span className="ml-2 text-[var(--gold)]">Update available</span>}</dd></div><div><dt className="text-[var(--muted)]">Downloaded</dt><dd className="font-bold">{formatDate(meta.downloadedAt)}</dd></div><div><dt className="text-[var(--muted)]">Approximate size</dt><dd className="font-bold">{formatSize(meta.sizeBytes)}</dd></div><div><dt className="text-[var(--muted)]">Content</dt><dd className="font-bold">{meta.hymnCount.toLocaleString()} songs · {meta.categoryCount} categories</dd></div></dl>}
    {!online&&<p className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--gold)]"><WifiOff size={16}/>Connect to the internet to download or check for updates.</p>}
    {state==="downloading"&&<p className="mt-4 text-sm font-bold text-[var(--sage)]">Downloading hymn library{progress!==null?`… ${progress}%`:"…"}</p>}
    {message&&<p role="status" className={`mt-4 text-sm font-bold ${state==="error"?"text-[var(--active-red)]":"text-[var(--sage)]"}`}>{message}</p>}
    <div className="mt-5 flex flex-wrap gap-2">{!meta?<button type="button" onClick={download} disabled={!online||state==="downloading"} className="focus-ring min-h-11 rounded-xl bg-[var(--sage)] px-4 text-sm font-bold text-white disabled:opacity-50">Download library</button>:<><button type="button" onClick={check} disabled={!online||state!=="idle"} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] px-4 text-sm font-bold disabled:opacity-50"><RefreshCw size={16}/>Check for updates</button>{updateAvailable&&<button type="button" onClick={download} disabled={!online||state==="downloading"} className="focus-ring min-h-11 rounded-xl bg-[var(--sage)] px-4 text-sm font-bold text-white disabled:opacity-50">Update library</button>}<button type="button" onClick={download} disabled={!online||state==="downloading"} className="focus-ring min-h-11 rounded-xl border border-[var(--line)] px-4 text-sm font-bold disabled:opacity-50">Re-download library</button></>}</div>
  </section>;
}

