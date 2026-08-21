"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, List, Menu, Search } from "lucide-react";
import { OfflineNewTranslationsRoute } from "@/components/offline-new-translations";
import { OFFLINE_NAVIGATION_EVENT } from "@/components/offline-navigation";
import type { HymnKind, HymnLanguage, HymnSummary } from "@/lib/hymns/types";
import { normalizeHymnNumberQuery, normalizeSearchText, normalizeTitlePrefix } from "@/lib/hymns/search";

const CHORD_TOKEN=/^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?$/i;
const SHOW_HYMN_SECTION_SELECTOR=false;
const HYMN_RETURN_TARGET_KEY="hymn-house:hymn-return-target";

type NewTranslationSummary={id:string;englishNumber:number;title:string;category:string;englishTitle:string|null;searchText:string};
type HymnSectionTab="hymns"|"new"|null;

function isChordOnlyText(value:string):boolean {
  const tokens=value.trim().replace(/[|,:()\-–—]/g," ").split(/\s+/).filter(Boolean);
  return tokens.length>0&&tokens.every(token=>CHORD_TOKEN.test(token));
}

function displayNumber(number:number|null|undefined):string {
  if(number==null)return "—";
  return String(number).padStart(3,"0");
}

function rememberHymnReturnTarget(id:string):void {
  try{sessionStorage.setItem(HYMN_RETURN_TARGET_KEY,id)}catch{}
}

const HymnList=memo(function HymnList({results,kind,language,exactNumber}:{results:HymnSummary[];kind:HymnKind;language:HymnLanguage;exactNumber?:string}) {
  return <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{results.map(h=>{const exact=String(h.number)===exactNumber;const showFirstLine=h.firstLine&&h.firstLine!==h.title&&!(kind==="yp"&&isChordOnlyText(h.firstLine));const rowId=`hymn-list-row-${kind}-${language}-${h.id}`;return <Link id={rowId} key={h.id} href={`/${kind}/${language}/${h.id}`} onClick={()=>rememberHymnReturnTarget(rowId)} style={{contentVisibility:"auto",containIntrinsicSize:"auto 72px"}} className={`hymn-list-row focus-ring flex min-h-14 items-center gap-4 px-2 py-4 hover:bg-[var(--sage-soft)] ${exact?"bg-[var(--sage-soft)]":""}`}><span className="w-12 shrink-0 text-center font-serif text-xl text-[var(--gold)]">{displayNumber(h.number)}</span><span className="min-w-0"><strong className={`block text-[15px] ${language==="my"?"myanmar":""}`}>{h.title}</strong>{showFirstLine&&<small className={`mt-1 block truncate text-[var(--muted)] ${language==="my"?"myanmar":""}`}>{h.firstLine}</small>}</span><ChevronRight className="ml-auto shrink-0 text-[var(--muted)]" size={18}/></Link>})}</div>;
});

function NewTranslationList({items}:{items:NewTranslationSummary[]}){
  return <div className="grid gap-0.5">{items.map(item=><Link key={item.id} href={`/hymns/new-translations/${item.englishNumber}`} style={{contentVisibility:"auto",containIntrinsicSize:"auto 56px"}} className="focus-ring grid min-h-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-[10px] px-2 py-3 text-black no-underline hover:bg-[var(--sage-soft)]"><span className="tabular-nums text-[0.84rem] font-bold text-black">E{item.englishNumber}</span><span className="myanmar min-w-0 text-base font-bold leading-[1.4] text-black">{item.title}</span></Link>)}</div>;
}

function BlueSearchForm({query,onQueryChange,onSubmit}:{query:string;onQueryChange:(value:string)=>void;onSubmit:()=>void}){
  return <form role="search" className="min-w-0 flex-1" onSubmit={(event)=>{event.preventDefault();onSubmit()}}><div className="flex h-11 overflow-hidden rounded-lg border border-black bg-[var(--paper)]"><label className="min-w-0 flex-1"><span className="sr-only">Search hymns</span><input type="text" lang="my" dir="ltr" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="search" value={query} onChange={(event)=>onQueryChange(event.currentTarget.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form?.requestSubmit()}}} className="myanmar-search-input h-full w-full border-0 bg-transparent px-3 text-sm outline-none" /></label><button type="submit" aria-label="Search" className="focus-ring flex h-full w-11 shrink-0 items-center justify-center border-l border-black bg-[var(--paper)] text-black transition hover:bg-[var(--sage-soft)]"><Search aria-hidden="true" size={19}/></button></div></form>;
}

function SearchBarWithMenu({kind,query,onQueryChange,onSubmit,menuOpen,onMenuToggle,onMenuClose}:{kind:HymnKind;query:string;onQueryChange:(value:string)=>void;onSubmit:()=>void;menuOpen:boolean;onMenuToggle:()=>void;onMenuClose:()=>void}){
  const menuId=kind==="yp"?"yp-quick-menu":"hymns-quick-menu";
  const newTranslationsHref=kind==="yp"?"/hymns/new-translations?section=yp":"/hymns/new-translations";
  const menuItemClass="focus-ring flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold no-underline transition hover:bg-blue-600";

  return <div className="w-full max-w-md rounded-xl bg-blue-100 p-1.5"><div className="flex items-center gap-2"><BlueSearchForm query={query} onQueryChange={onQueryChange} onSubmit={onSubmit}/><div className="relative shrink-0"><button type="button" aria-label="Open menu" title="Menu" aria-expanded={menuOpen} aria-controls={menuId} onClick={onMenuToggle} className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg border border-black bg-blue-500 text-white transition hover:bg-blue-600"><Menu aria-hidden="true" size={22}/></button>{menuOpen&&<div id={menuId} role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 rounded-xl border border-blue-600 bg-blue-500 p-1.5 shadow-xl shadow-blue-300/50"><Link href="/categories" role="menuitem" onClick={onMenuClose} style={{color:"#fff"}} className={menuItemClass}><List aria-hidden="true" size={17} color="#fff"/><span style={{color:"#fff"}}>Categories</span></Link><Link href={newTranslationsHref} role="menuitem" onClick={onMenuClose} style={{color:"#fff"}} className={menuItemClass}><FileText aria-hidden="true" size={17} color="#fff"/><span style={{color:"#fff"}}>New translations</span></Link></div>}</div></div></div>;
}

export function HymnBrowser({ kind, myanmar, english=[], newTranslations=[], initialLanguage="my", initialQuery="", myanmarOnly=false, lyricSearchUrl }:{ kind:HymnKind; myanmar:HymnSummary[]; english?:HymnSummary[]; newTranslations?:NewTranslationSummary[]; initialLanguage?:HymnLanguage; initialQuery?:string; myanmarOnly?:boolean; lyricSearchUrl?:string }) {
  const router=useRouter();
  const [selectedLanguage,setSelectedLanguage]=useState<HymnLanguage>(initialLanguage);
  const [hymnSection,setHymnSection]=useState<HymnSectionTab>(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [query,setQuery]=useState(initialQuery);
  const [lyricSearchIndex,setLyricSearchIndex]=useState<Record<string,string>>({});
  const [submittedMissingNumber,setSubmittedMissingNumber]=useState(false);
  const [offlineTranslationPath,setOfflineTranslationPath]=useState<string|null>(null);
  const language: HymnLanguage=kind==="hymns"||myanmarOnly?"my":selectedLanguage;
  const source=language==="my"?myanmar:english;
  const deferredQuery=useDeferredValue(query);
  const normalizedQuery=normalizeSearchText(deferredQuery);
  const numberQuery=normalizeHymnNumberQuery(deferredQuery);
  const hasQuery=normalizedQuery.length>0;

  useEffect(()=>{if(!lyricSearchUrl||!navigator.onLine)return;let active=true;fetch(lyricSearchUrl).then(response=>response.ok?response.json():Promise.reject()).then((entries:Array<{id:string;lyricSearchText:string}>)=>{if(active)setLyricSearchIndex(Object.fromEntries(entries.map(entry=>[entry.id,entry.lyricSearchText]))) }).catch(()=>{});return()=>{active=false}},[lyricSearchUrl]);

  useEffect(()=>{
    const sync=()=>{
      const path=location.pathname;
      const isTranslationRoute=/^\/hymns\/new-translations(?:\/|$)/.test(path)||/^\/yp\/new-translations(?:\/|$)/.test(path);
      setOfflineTranslationPath(!navigator.onLine&&isTranslationRoute?path:null);
    };
    sync();
    window.addEventListener("popstate",sync);
    window.addEventListener(OFFLINE_NAVIGATION_EVENT,sync);
    window.addEventListener("online",sync);
    window.addEventListener("offline",sync);
    return()=>{
      window.removeEventListener("popstate",sync);
      window.removeEventListener(OFFLINE_NAVIGATION_EVENT,sync);
      window.removeEventListener("online",sync);
      window.removeEventListener("offline",sync);
    };
  },[]);

  useEffect(()=>{
    let targetId:string|null=null;
    try{targetId=sessionStorage.getItem(HYMN_RETURN_TARGET_KEY)}catch{}
    if(!targetId)return;
    const restore=()=>{
      const target=document.getElementById(targetId!);
      if(!target)return;
      target.scrollIntoView({block:"center",inline:"nearest",behavior:"auto"});
    };
    const frame=requestAnimationFrame(restore);
    const timer=window.setTimeout(()=>{
      restore();
      try{sessionStorage.removeItem(HYMN_RETURN_TARGET_KEY)}catch{}
    },120);
    return()=>{cancelAnimationFrame(frame);window.clearTimeout(timer)};
  },[]);

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

  const newResults=useMemo(()=>{
    if(!hasQuery)return newTranslations;
    const raw=deferredQuery.trim().toLocaleLowerCase();
    const englishNumberQuery=raw.replace(/^e\s*/i,"");
    return newTranslations.filter(item=>String(item.englishNumber).includes(englishNumberQuery)||item.searchText.includes(normalizedQuery));
  },[deferredQuery,hasQuery,newTranslations,normalizedQuery]);

  const submitSearch=()=>{
    if(kind==="hymns"&&/^e\s*\d+$/i.test(query.trim())){
      const raw=query.trim().replace(/^e\s*/i,"");
      const exact=newTranslations.find(item=>String(item.englishNumber)===raw);
      if(exact){setSubmittedMissingNumber(false);router.push(`/hymns/new-translations/${exact.englishNumber}`);return;}
      setSubmittedMissingNumber(true);
      return;
    }
    const exactNumber=normalizeHymnNumberQuery(query);
    if(exactNumber===undefined)return;
    const exact=source.find(h=>String(h.number)===exactNumber);
    if(exact){
      setSubmittedMissingNumber(false);
      if(!navigator.onLine){location.href=`/${kind}/${language}/${exact.id}`;return;}
      router.push(`/${kind}/${language}/${exact.id}`);
      return;
    }
    setSubmittedMissingNumber(true);
  };

  const updateQuery=(value:string)=>{setQuery(value);setSubmittedMissingNumber(false)};
  const switchHymnSection=(section:Exclude<HymnSectionTab,null>)=>setHymnSection(current=>current===section?null:section);
  const ypCountLabel=`${results.length.toLocaleString()} ${results.length===1?"song":"songs"}`;
  const hymnCountLabel=`${results.length.toLocaleString()} ${results.length===1?"hymn":"hymns"}`;
  const hymnListEmpty=kind==="hymns"&&results.length===0&&newResults.length===0;

  if(offlineTranslationPath)return <OfflineNewTranslationsRoute pathname={offlineTranslationPath}/>;

  return <main className="page">
    <header className="mb-3"><p className="eyebrow normal-case">Hymnal.net</p><h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">{kind==="yp"?"New Songs":"Hymns"}</h1></header>

    {kind==="yp"&&!myanmarOnly&&<div className="mb-3 flex w-full rounded-xl bg-[var(--sage-soft)] p-1 sm:w-fit" role="group" aria-label="Language">{(["my","en"] as const).map(lang=><button key={lang} onClick={()=>setSelectedLanguage(lang)} className={`focus-ring flex-1 rounded-lg px-7 py-2.5 text-sm font-bold sm:flex-none ${language===lang?"bg-[var(--paper)] text-[var(--ink)] shadow-sm":"text-[var(--muted)]"}`}>{lang==="my"?"မြန်မာ":"English"}</button>)}</div>}

    <SearchBarWithMenu kind={kind} query={query} onQueryChange={updateQuery} onSubmit={submitSearch} menuOpen={menuOpen} onMenuToggle={()=>setMenuOpen(open=>!open)} onMenuClose={()=>setMenuOpen(false)}/>

    {SHOW_HYMN_SECTION_SELECTOR&&kind==="hymns"&&<div className="mx-auto mt-3 flex w-fit items-center rounded-lg bg-blue-500 p-0.5 shadow-md shadow-blue-300/70" role="group" aria-label="Hymn section">
      <button type="button" onClick={()=>switchHymnSection("hymns")} aria-pressed={hymnSection==="hymns"} className={`focus-ring myanmar rounded-md px-3 py-1 text-[11px] font-bold text-white ${hymnSection==="hymns"?"bg-blue-600 shadow-sm":""}`}>ဓမ္မသီချင်း</button>
      <span aria-hidden="true" className="px-0.5 text-xs font-bold text-white">|</span>
      <button type="button" onClick={()=>switchHymnSection("new")} aria-pressed={hymnSection==="new"} className={`focus-ring myanmar rounded-md px-3 py-1 text-[11px] font-bold text-white ${hymnSection==="new"?"bg-blue-600 shadow-sm":""}`}>အသစ်</button>
    </div>}

    {kind==="hymns"&&<p className="my-4 text-sm text-[var(--muted)]">{hymnCountLabel}</p>}
    {kind==="yp"&&<p className="my-4 text-sm text-[var(--muted)]">{ypCountLabel}</p>}

    {kind==="hymns"&&results.length>0&&hymnSection!=="new"&&<HymnList results={results} kind={kind} language={language} exactNumber={numberQuery}/>} 
    {kind==="hymns"&&newResults.length>0&&hymnSection!=="hymns"&&<div className={results.length>0&&hymnSection===null?"mt-6 border-t border-[var(--line)] pt-6":""}><NewTranslationList items={newResults}/></div>}
    {kind==="yp"&&results.length>0&&<HymnList results={results} kind={kind} language={language} exactNumber={numberQuery}/>} 

    {submittedMissingNumber&&<div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5"><p className="font-serif text-xl">No matching song number</p><p className="mt-1 text-sm text-[var(--muted)]">Try a different number or title.</p></div>}
    {!submittedMissingNumber&&kind==="yp"&&results.length===0&&<div className="py-16 text-center"><p className="font-serif text-2xl">No songs found</p><p className="mt-2 text-sm text-[var(--muted)]">Try another search.</p></div>}
    {!submittedMissingNumber&&hymnListEmpty&&<div className="py-16 text-center"><p className="font-serif text-2xl">No hymns found</p><p className="mt-2 text-sm text-[var(--muted)]">Try another search.</p></div>}
  </main>;
}
