"use client";

import Link from "next/link";
import { useMemo,useState } from "react";
import { SearchField } from "@/components/search-field";

type TranslationSummary={id:string;englishNumber:number;title:string;category:string;englishTitle:string|null;searchText:string};

export function NewTranslationBrowser({items}:{items:TranslationSummary[]}){
  const [query,setQuery]=useState("");
  const results=useMemo(()=>{
    const normalized=query.trim().toLocaleLowerCase();
    if(!normalized)return items;
    const numeric=normalized.replace(/^eng\s*/i,"");
    return items.filter(item=>String(item.englishNumber).includes(numeric)||item.searchText.includes(normalized));
  },[items,query]);

  return <main className="page">
    <Link href="/" className="focus-ring mb-5 inline-flex rounded-lg text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">← Back to Hymns</Link>
    <header className="mb-7">
      <p className="eyebrow normal-case">Hymnal.net</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">New Translations</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Myanmar hymn numbers have not been assigned yet. Listed by English hymn number.</p>
    </header>
    <SearchField value={query} onChange={setQuery} placeholder="Search ENG number or Myanmar title…" cleanFocus />
    <p className="my-4 text-sm text-[var(--muted)]">{results.length} {results.length===1?"translation":"translations"}</p>
    {results.length>0?<div className="grid gap-0.5">{results.map(item=><Link key={item.id} href={`/hymns/new-translations/${item.englishNumber}`} className="focus-ring grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-[10px] px-2 py-3 font-bold text-black no-underline hover:bg-[var(--sage-soft)]"><span className="tabular-nums text-[0.84rem] font-bold text-black">ENG {item.englishNumber}</span><span className="myanmar min-w-0 text-base font-bold leading-[1.4] text-black">{item.title}</span></Link>)}</div>:<div className="py-16 text-center"><p className="font-serif text-2xl">No translations found</p><p className="mt-2 text-sm text-[var(--muted)]">Try an English hymn number or Myanmar title.</p></div>}
  </main>;
}
