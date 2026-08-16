"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";

const VERSION_KEY="hymn-house:installed-app-version";

async function registerVersion(version:string){
  const registration=await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(version)}`,{updateViaCache:"none"});
  await registration.update();
  registration.active?.postMessage({type:"PRECACHE_APP_SHELL"});
}

export function ServiceWorker(){
  const [availableVersion,setAvailableVersion]=useState<string|null>(null);
  const [applying,setApplying]=useState(false);
  const applyUpdate=useCallback(()=>{
    if(!availableVersion)return;
    setApplying(true);
    localStorage.setItem(VERSION_KEY,availableVersion);
    void registerVersion(availableVersion).catch(()=>setApplying(false));
  },[availableVersion]);
  useEffect(()=>{
    if(!("serviceWorker" in navigator))return;
    if(process.env.NODE_ENV==="development"){
      navigator.serviceWorker.getRegistrations().then(registrations=>Promise.all(registrations.map(registration=>registration.unregister())));
      if("caches" in window)caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("hymn-house-")).map(key=>caches.delete(key))));
      return;
    }
    const hadController=Boolean(navigator.serviceWorker.controller);
    let refreshing=false;
    const handleControllerChange=()=>{if(hadController&&!refreshing){refreshing=true;location.reload()}};
    navigator.serviceWorker.addEventListener("controllerchange",handleControllerChange);
    const checkForUpdate=async()=>{
      if(!navigator.onLine)return;
      let version:string|undefined;
      try{const response=await fetch("/app-version",{cache:"no-store"});if(response.ok)version=(await response.json() as {version?:string}).version}catch{return}
      if(!version)return;
      const installedVersion=localStorage.getItem(VERSION_KEY);
      if(installedVersion&&installedVersion!==version){setAvailableVersion(version);return}
      localStorage.setItem(VERSION_KEY,version);
      await registerVersion(version);
    };
    void checkForUpdate();
    return()=>navigator.serviceWorker.removeEventListener("controllerchange",handleControllerChange);
  },[]);
  if(!availableVersion)return null;
  return <aside role="status" aria-live="polite" className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto flex w-auto max-w-md items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 shadow-[0_12px_36px_rgba(37,50,43,.18)] md:bottom-6">
    <Download aria-hidden="true" className="shrink-0 text-[var(--sage)]" size={20}/><p className="min-w-0 text-sm font-semibold leading-5">A new Hymn House update is ready.</p><button type="button" onClick={applyUpdate} disabled={applying} className="focus-ring shrink-0 rounded-xl bg-[var(--sage)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{applying?"Updating…":"Download update"}</button>
  </aside>;
}
