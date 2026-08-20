"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { downloadOfflineLibrary, getAvailableOfflineLibraryVersion, readOfflineLibraryMeta } from "@/lib/offline-library";

const DISMISSED_KEY="hymn-house:offline-prompt-dismissed";

type Mode="download"|"update";
type Status="idle"|"downloading"|"ready"|"error";

export function OfflineLibraryPrompt(){
  const [visible,setVisible]=useState(false),[mode,setMode]=useState<Mode>("download"),[status,setStatus]=useState<Status>("idle"),[progress,setProgress]=useState<number|null>(null);

  useEffect(()=>{
    let active=true;
    let closeTimer:number|undefined;

    const autoUpdate=async()=>{
      try{
        const meta=await readOfflineLibraryMeta();
        if(!active)return;

        if(!meta){
          if(localStorage.getItem(DISMISSED_KEY)!=="true"){
            setMode("download");
            setStatus("idle");
            setVisible(true);
          }
          return;
        }

        const available=await getAvailableOfflineLibraryVersion();
        if(!active||available.version===meta.version)return;

        setMode("update");
        setVisible(true);
        setStatus("downloading");
        setProgress(null);
        try{
          await downloadOfflineLibrary((received,total)=>{
            if(active)setProgress(total?Math.min(100,Math.round(received/total*100)):null);
          });
          if(!active)return;
          setStatus("ready");
          closeTimer=window.setTimeout(()=>{if(active)setVisible(false)},1200);
        }catch{
          if(active)setStatus("error");
        }
      }catch{}
    };

    void autoUpdate();
    return()=>{active=false;if(closeTimer!==undefined)window.clearTimeout(closeTimer)};
  },[]);

  if(!visible)return null;

  const dismiss=()=>{
    if(mode==="download")localStorage.setItem(DISMISSED_KEY,"true");
    setVisible(false);
  };

  const download=async()=>{
    setStatus("downloading");
    setProgress(null);
    try{
      await downloadOfflineLibrary((received,total)=>setProgress(total?Math.min(100,Math.round(received/total*100)):null));
      setStatus("ready");
      window.setTimeout(()=>setVisible(false),1200);
    }catch{
      setStatus("error");
    }
  };

  const isUpdate=mode==="update";

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/25 p-5 backdrop-blur-[3px]" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="offline-prompt-title" aria-describedby="offline-prompt-description" className="w-full max-w-sm rounded-[26px] bg-[var(--paper)] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
      <div className="mx-auto grid size-10 place-items-center rounded-[13px] bg-[var(--sage-soft)] text-[var(--sage)]" aria-hidden="true"><Download size={19}/></div>
      <div className="mt-4 text-center">
        <h2 id="offline-prompt-title" className="myanmar text-xl font-bold leading-8">{isUpdate?"အော့ဖ်လိုင်းစာကြည့်တိုက်ကို အပ်ဒိတ်လုပ်နေပါသည်":"အော့ဖ်လိုင်းအတွက် ဒေါင်းလုဒ်လုပ်မလား?"}</h2>
        <div id="offline-prompt-description" className="myanmar mt-2 text-sm leading-7 text-[var(--muted)]">
          {isUpdate?<><p>သီချင်းအသစ်များနှင့် ပြင်ဆင်ချက်များကို အလိုအလျောက် ထည့်သွင်းနေပါသည်။</p><p>ပြီးပါက အင်တာနက်မရှိဘဲ ဖတ်ရှုနိုင်ပါမည်။</p></>:<><p>ဓမ္မသီချင်းများကို အင်တာနက်မရှိဘဲ ဖတ်ရှုနိုင်ပါမည်။</p><p>ပီယာနိုစာရွက်၊ Jianpu နှင့် အသံဖိုင်များအတွက် အင်တာနက်လိုအပ်ပါသည်။</p></>}
        </div>
      </div>
      {status==="downloading"&&<p className="myanmar mt-4 text-center text-sm font-bold text-[var(--sage)]">{isUpdate?"အပ်ဒိတ်လုပ်နေပါသည်":"ဒေါင်းလုဒ်လုပ်နေပါသည်"}{progress!==null?`… ${progress}%`:"…"}</p>}
      {status==="ready"&&<p className="myanmar mt-4 text-center text-sm font-bold text-[var(--sage)]">{isUpdate?"အော့ဖ်လိုင်းစာကြည့်တိုက် အပ်ဒိတ်ပြီးပါပြီ ✓":"အော့ဖ်လိုင်းစာကြည့်တိုက် အသင့်ဖြစ်ပါပြီ ✓"}</p>}
      {status==="error"&&<p className="myanmar mt-4 text-center text-sm font-bold text-[var(--active-red)]">{isUpdate?"အပ်ဒိတ် မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။":"ဒေါင်းလုဒ် မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။"}</p>}
      <div className="mt-5 grid gap-2">
        {(!isUpdate||status==="error")&&<button type="button" onClick={download} disabled={status==="downloading"||status==="ready"} className="focus-ring myanmar min-h-12 rounded-2xl bg-[var(--sage)] px-5 text-sm font-bold text-white disabled:opacity-60">{status==="error"?"ထပ်ကြိုးစားမည်":isUpdate?"အပ်ဒိတ်လုပ်မည်":"ဒေါင်းလုဒ်"}</button>}
        {(mode==="download"||status==="error")&&<button type="button" onClick={dismiss} disabled={status==="downloading"} className="focus-ring myanmar min-h-11 rounded-xl px-4 text-sm font-bold text-[var(--muted)] disabled:opacity-60">နောက်မှ</button>}
      </div>
    </section>
  </div>;
}
