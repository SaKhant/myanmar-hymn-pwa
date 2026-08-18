"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX, WifiOff } from "lucide-react";

export function OnlineAudio({src}:{src:string}){
  const [online,setOnline]=useState(true);
  const [failed,setFailed]=useState(false);

  useEffect(()=>{const sync=()=>setOnline(navigator.onLine);sync();window.addEventListener("online",sync);window.addEventListener("offline",sync);return()=>{window.removeEventListener("online",sync);window.removeEventListener("offline",sync)}},[]);
  useEffect(()=>setFailed(false),[src]);

  return <div className="surface mb-7 p-5">{!online?<p className="flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><WifiOff size={18}/>Audio requires an internet connection</p>:failed?<p className="flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><VolumeX size={18}/>Audio is not available for this song</p>:<><p className="mb-3 flex items-center gap-2 font-bold"><Volume2 size={19}/>Audio</p><audio controls preload="none" className="w-full" src={src} onError={()=>setFailed(true)}>Your browser does not support audio.</audio></>}</div>;
}

