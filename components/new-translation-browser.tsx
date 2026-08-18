"use client";

import Link from "next/link";
import { useMemo,useState } from "react";
import { SearchField } from "@/components/search-field";
import type { HymnSummary } from "@/lib/hymns/types";

type TranslationSummary={id:string;englishNumber:number;title:string;category:string;englishTitle:string|null;searchText:string};
type TranslationSection="hymns"|"yp";

export function NewTranslationBrowser({items,ypItems}:{items:TranslationSummary[];ypItems:HymnSummary[]}){
  const [section,setSection]=useState<TranslationSection>("hymns");
  const [query,setQuery]=useState("");

  const hymnResults=useMemo(()=>{
    const normalized=query.trim().toLocaleLowerCase();
    if(!normalized)return items;
    const numeric=normalized.replace(/^(?:eng|e)\s*/i,"");
    return items.filter(item=>String(item.englishNumber).includes(numeric)||item.searchText.includes(normalized));
  },[items,query]);

  const ypResults=useMemo(()=>{
    const normalized=query.trim().toLocaleLowerCase();
    if(!normalized)return ypItems;
    const numeric=normalized.replace(/^(?:yp)\s*/i,"");
    return ypItems.filter(item=>String(item.number??"").includes(numeric)||item.searchText.includes(normalized));
  },[query,ypItems]);

  const resultsCount=section==="hymns"?hymnResults.length:ypResults.length;

  return <main className="page">
    <Link href="/" className="focus-ring mb-5 inline-flex rounded-lg text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">← Back to Hymns</Link>
    <header className="mb-5">
      <p className="eyebrow normal-case">Hymnal.net</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">New Translations</h1>
    </header>

    <div className="mb-5 flex w-full max-w-sm rounded-xl bg-[var(--sage-soft)] p-1" role="group" aria-label="New translation collection">
      <button type="button" onClick={()=>{setSection("hymns");setQuery("")}} aria-pressed={section==="hymns"} className={`focus-ring flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${section==="hymns"?"bg-[var(--paper)] text-[var(--ink)] shadow-sm":"text-[var(--muted)]"}`}>Hymns</button>
      <button type="button" onClick={()=>{setSection("yp");setQuery("")}} aria-pressed={section==="yp"} className={`focus-ring flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${section==="yp"?"bg-[var(--paper)] text-[var(--ink)] shadow-sm":"text-[var(--muted)]"}`}>YP Songs</button>
    </div>

    {section==="hymns"?<p className="mb-5 text-sm text-[var(--muted)]">Myanmar hymn numbers have not been assigned yet. Listed by English hymn number.</p>:<p className="mb-5 text-sm text-[var(--muted)]">Recently added Myanmar YP translations.</p>}

    <SearchField value={query} onChange={setQuery} placeholder={section==="hymns"?"Search E number or Myanmar title…":"Search YP number or Myanmar title…"} cleanFocus />
    <p className="my-4 text-sm text-[var(--muted)]">{resultsCount} {resultsCount===1?"translation":"translations"}</p>

    {section==="hymns"?(hymnResults.length>0?<div className="grid gap-0.5">{hymnResults.map(item=><Link key={item.id} href={`/hymns/new-translations/${item.englishNumber}`} className="focus-ring grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-[10px] px-2 py-3 font-bold text-black no-underline hover:bg-[var(--sage-soft)]"><span className="tabular-nums text-[0.84rem] font-bold text-black">E{item.englishNumber}</span><span className="myanmar min-w-0 text-base font-bold leading-[1.4] text-black">{item.title}</span></Link>)}</div>:<div className="py-16 text-center"><p className="font-serif text-2xl">No translations found</p><p className="mt-2 text-sm text-[var(--muted)]">Try an English hymn number or Myanmar title.</p></div>):(ypResults.length>0?<div className="grid gap-0.5">{ypResults.map(item=><Link key={item.id} href={`/yp/my/${item.id}`} className="focus-ring grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-[10px] px-2 py-3 font-bold text-black no-underline hover:bg-[var(--sage-soft)]"><span className="tabular-nums text-[0.84rem] font-bold text-black">YP {item.number}</span><span className="myanmar min-w-0 text-base font-bold leading-[1.4] text-black">{item.title}</span></Link>)}</div>:<div className="py-16 text-center"><p className="font-serif text-2xl">No YP translations found</p><p className="mt-2 text-sm text-[var(--muted)]">Try a YP number or Myanmar title.</p></div>)}
  </main>;
}
