"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { navigateOffline } from "@/components/offline-navigation";

export function ReaderBackButton({fallback,label}:{fallback:string;label:string}){
  const router=useRouter();
  const fallbackHome=()=>navigator.onLine?router.replace(fallback):navigateOffline(fallback,true);
  const goBack=()=>{
    const navigation=(window as Window&{navigation?:{currentEntry?:{index:number};entries:()=>Array<{index:number;url:string}>}}).navigation;
    if(navigation?.currentEntry){
      const previous=navigation.entries().find(entry=>entry.index===navigation.currentEntry!.index-1);
      if(previous){
        const url=new URL(previous.url);
        if(url.origin===location.origin&&!/^\/hymns\/(?:my|en)\/[^/]+/.test(url.pathname)){router.back();return}
      }
      fallbackHome();
      return;
    }
    if(document.referrer&&new URL(document.referrer).origin===location.origin){router.back();return}
    if(window.history.length>1){router.back();return}
    fallbackHome();
  };
  return <button type="button" onClick={goBack} className="focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-[var(--muted)]"><ArrowLeft size={15}/>{label}</button>;
}
