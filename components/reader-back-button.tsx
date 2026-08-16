"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { navigateOffline } from "@/components/offline-navigation";

export function ReaderBackButton({fallback,label}:{fallback:string;label:string}){
  const router=useRouter();
  const fallbackHome=()=>navigator.onLine?router.replace(fallback):navigateOffline(fallback,true);
  return <button type="button" onClick={fallbackHome} className="focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-[var(--muted)]"><ArrowLeft size={15}/>{label}</button>;
}
