"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { HymnKind, HymnLanguage, HymnSummary } from "@/lib/hymns/types";
import { normalizeHymnNumberQuery, normalizeSearchText, normalizeTitlePrefix } from "@/lib/hymns/search";
import { SearchField } from "./search-field";

const CHORD_TOKEN=/^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?$/i;

function isChordOnlyText(value:string):boolean {
  const tokens=value.trim().replace(/[|,:()\-–—]/g," ").split(/\s+/).filter(Boolean);
  return tokens.length>0&&tokens.every(token=>CHORD_TOKEN.test(token));
}

function displayNumber(number:number|null|undefined):string {
  if(number==null)return "—";
  return String(number).padStart(3,"0");
}

function HymnList({results,kind,language,exactNumber}:{results:HymnSummary[];kind:HymnKind;language:HymnLanguage;exactNumber?:string}) {
  return <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{results.map(h=>{const exact=String(h.number)===exactNumber;const showFirstLine=h.firstLine&&h.firstLine!==h.title&&!(kind==="yp"&&isChordOnlyText(h.firstLine));return <Link key={h.id} href={`/${kind}/${language}/${h.id}`} className={`hymn-list-row focus-ring flex min-h-14 items-center gap-4 px-2 py-4 hover:bg-[var(--sage-soft)] ${exact?"bg-[var(--sage-soft)]":""}`}><span className="w-12 shrink-0 text-center font-serif text-xl text-[var(--gold)]">{displayNumber(h.number)}</span><span className="min-w-0"><strong className={`block text-[15px] ${language==="my"?"myanmar":""}`}>{h.title}</strong>{showFirstLine&&<small className={`mt-1 block truncate text-[var(--muted)] ${language==="my"?"myanmar":""}`}>{h.firstLine}</small>}</span><ChevronRight className="ml-auto shrink-0 text-[var(--muted)]" size={18}/></Link>})}</div>;
}

export function HymnBrowser({ kind, myanmar, english=[], initialLanguage="my", initialQuery="", myanmarOnly=false, lyricSearchUrl }:{ kind:HymnKind; myanmar:HymnSummary[]; english?:HymnSummary[]; initialLanguage?:HymnLanguage; initialQuery?:string; myanmarOnly?:boolean; lyricSearchUrl?:string }) {
  const router=useRouter();
  const [selectedLanguage,setSelectedLanguage]=useState<HymnLanguage>(initialLanguage); const [query,setQuery]=useState(initialQuery);
  const [lyricSearchIndex,setLyricSearchIndex]=useState<Record<string,string>>({});
  const [submittedMissingNumber,setSubmittedMissingNumber]=useState(false);
  const language: HymnLanguage=kind==="hymns"||myanmarOnly?"my":selectedLanguage;
  const source=language==="my"?myanmar:english;
  const deferredQuery=useDeferredValue(query);
  const normalizedQuery=normalizeSearchText(deferredQuery);
  const numberQuery=normalizeHymnNumberQuery(deferredQuery);
  const hasQuery=normalizedQuery.length>0;
  useEffect(()=>{if(!lyricSearchUrl||!navigator.onLine)return;let active=true;fetch(lyricSearchUrl).then(response=>response.ok?response.json():Promise.reject()).then((entries:Array<{id:string;lyricSearchText:string}>)=>{if(active)setLyricSearchIndex(Object.fromEntries(entries.map(entry=>[entry.id,entry.lyricSearchText]))) }).catch(()=>{});return()=>{active=false}},[lyricSearchUrl]);
  const results=useMemo(()=>{
    if(!normalizedQuery)return source;
    if(numberQuery!==undefined){
      const matches=source.filter(h=>String(h.number??"").includes(numberQuery));
      matches.sort((a,b)=>Number(String(b.number)===numberQuery)-Number(String(a.number)===numberQuery));
      return matches;
    }
    if(kind==="hymns"&&language==="my"){
      const prefix=normalizeTitlePrefix(normalizedQuery);
      if(!prefix)return [];
      const prefixMatches=source.filter(h=>normalizeTitlePrefix(h.title).startsWith(prefix)||normalizeTitlePrefix(h.firstLine).startsWith(prefix));
      if(Array.from(prefix).length<=2)return prefixMatches;
      const prefixIds=new Set(prefixMatches.map(h=>h.id));
      const lyricMatches=source.filter(h=>!prefixIds.has(h.id)&&(lyricSearchIndex[h.id]??h.lyricSearchText).includes(prefix));
      return [...prefixMatches,...lyricMatches];
    }
    return source.filter(h=>h.searchText.includes(normalizedQuery));
  },[kind,language,lyricSearchIndex,normalizedQuery,numberQuery,source]);
  const submitSearch=()=>{
    const exactNumber=normalizeHymnNumberQuery(query);
    if(exactNumber===undefined)return;
    const exact=source.find(h=>String(h.number)===exactNumber);
    if(exact){
      setSubmittedMissingNumber(false);
      if(!navigator.onLine){
        // The cached application shell reads this route from IndexedDB offline.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        location.href=`/${kind}/${language}/${exact.id}`;
        return;
      }
      router.push(`/${kind}/${language}/${exact.id}`);
      return;
    }
    setSubmittedMissingNumber(true);
  };
  const countLabel=kind==="hymns"&&!hasQuery?"700 Hymns":`${results.length.toLocaleString()} ${results.length===1?(kind==="hymns"?"hymn":"song"):(kind==="hymns"?"hymns":"songs")}`;
  return <main className="page"><header className="mb-7"><p className="eyebrow normal-case">Hymnal.net</p><h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">{kind==="yp"?"New Songs":"Hymns"}</h1></header>
    {kind==="yp"&&!myanmarOnly&&<div className="mb-5 flex w-full rounded-xl bg-[var(--sage-soft)] p-1 sm:w-fit" role="group" aria-label="Language">{(["my","en"] as const).map(lang=><button key={lang} onClick={()=>setSelectedLanguage(lang)} className={`focus-ring flex-1 rounded-lg px-7 py-2.5 text-sm font-bold sm:flex-none ${language===lang?"bg-[var(--paper)] text-[var(--ink)] shadow-sm":"text-[var(--muted)]"}`}>{lang==="my"?"မြန်မာ":"English"}</button>)}</div>}
    <SearchField value={query} onChange={(value)=>{setQuery(value);setSubmittedMissingNumber(false)}} onSubmit={submitSearch} placeholder="Search number, title, or lyric…" cleanFocus/>
    <p className="my-4 text-sm text-[var(--muted)]">{countLabel}</p>
    {results.length>0&&<HymnList results={results} kind={kind} language={language} exactNumber={numberQuery}/>} 
    {results.length===0&&<div className="py-16 text-center"><p className="font-serif text-2xl">{submittedMissingNumber?(kind==="hymns"?"Hymn not found":"Song not found"):(kind==="hymns"?"No hymns found":"No songs found")}</p><p className="mt-2 text-sm text-[var(--muted)]">Try a number, title, or phrase from the lyrics.</p></div>}
  </main>;
}
