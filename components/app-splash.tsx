"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function AppSplash() {
  const [state,setState]=useState<"visible"|"fading"|"hidden">("visible");

  useEffect(()=>{
    const fadeTimer=window.setTimeout(()=>setState("fading"),900);
    const hideTimer=window.setTimeout(()=>setState("hidden"),1200);
    return ()=>{window.clearTimeout(fadeTimer);window.clearTimeout(hideTimer);};
  },[]);

  if(state==="hidden")return null;
  return <div className={`app-splash ${state==="fading"?"app-splash-fading":""}`} role="status" aria-live="polite" aria-label="Loading hymn data">
    <div className="app-splash-content">
      <Image src="/splash-guitar.png" alt="" width={768} height={768} priority className="app-splash-image"/>
      <p className="app-splash-loading"><span className="app-splash-spinner" aria-hidden="true"/>Loading hymn data…</p>
    </div>
  </div>;
}
