"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WifiOff } from "lucide-react";
import { NewTranslationBrowser } from "@/components/new-translation-browser";
import { ReaderBackButton } from "@/components/reader-back-button";
import { TranslationGuitarReader } from "@/components/translation-guitar-reader";
import {
  readOfflineNewTranslations,
  readOfflineNewYpTranslations,
  type OfflineNewTranslation,
  type OfflineNewYpTranslation,
} from "@/lib/offline-library";
import { parseNewYpTranslationLines, parseNumberedTranslationLines } from "@/lib/hymns/translation-display";

function compactSourceRef(value:string|null):string|null {
  if(!value)return null;
  return value.replace(/^([A-Za-z]+)\s+(\d+)$/,"$1$2");
}

function hymnSummary(item:OfflineNewTranslation){
  return {
    id:item.id,
    englishNumber:item.english_number,
    title:item.title,
    category:item.category,
    englishTitle:item.english_title,
    searchText:`${item.english_number} ${item.title} ${item.category} ${item.english_title??""}`.toLocaleLowerCase(),
  };
}

function ypSummary(item:OfflineNewYpTranslation){
  const sourceRef=compactSourceRef(item.source_ref);
  return {
    id:item.id,
    title:item.title,
    sourceRef,
    sourceNumber:item.source_number,
    searchText:`${item.source_ref??""} ${sourceRef??""} ${item.source_number??""} ${item.title} ${item.raw_lines.join(" ")}`.toLocaleLowerCase(),
  };
}

function OfflineHymnTranslationReader({item,items}:{item:OfflineNewTranslation;items:OfflineNewTranslation[]}){
  const sections=parseNumberedTranslationLines(item.raw_lines);
  const index=items.findIndex(candidate=>candidate.id===item.id);
  const previous=index>0?items[index-1]:undefined;
  const next=index>=0&&index<items.length-1?items[index+1]:undefined;

  return <main className="page max-w-3xl">
    <ReaderBackButton fallback="/hymns/new-translations" label="Back to New Translations"/>
    <p className="eyebrow normal-case"><span>MYANMAR TRANSLATION</span>{" • "}<Link href={`/hymns/en/${item.english_number}`}>E{item.english_number}</Link></p>
    <h1 className="myanmar mt-3 font-serif text-3xl leading-tight tracking-tight md:text-4xl">{item.title}</h1>
    <p className="myanmar mt-3 text-sm text-[var(--muted)]">{item.category}{item.meter?` • ${item.meter}`:""}</p>
    {item.english_title?<p className="mt-2 text-sm text-[var(--muted)]">{item.english_title}</p>:null}
    {item.source_note?<p className="mt-2 text-sm text-[var(--muted)]">{item.source_note}</p>:null}

    <div className="mt-7"><TranslationGuitarReader sections={sections} apiUrl={`/api/new-translation-guitar/${item.english_number}`} sourceLabel={`E${item.english_number}`}/></div>
    <p className="mt-5 flex items-center gap-2 text-sm font-bold text-[var(--gold)]"><WifiOff size={16}/>Audio and uncached guitar data require internet.</p>

    <nav className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-5 text-sm font-semibold" aria-label="Translation navigation">
      {previous?<Link href={`/hymns/new-translations/${previous.english_number}`}>← E{previous.english_number}</Link>:<span/>}
      {next?<Link href={`/hymns/new-translations/${next.english_number}`}>E{next.english_number} →</Link>:<span/>}
    </nav>
  </main>;
}

function OfflineYpTranslationReader({item,items}:{item:OfflineNewYpTranslation;items:OfflineNewYpTranslation[]}){
  const sections=parseNewYpTranslationLines(item.raw_lines);
  const index=items.findIndex(candidate=>candidate.id===item.id);
  const previous=index>0?items[index-1]:undefined;
  const next=index>=0&&index<items.length-1?items[index+1]:undefined;
  const sourceLabel=compactSourceRef(item.source_ref);

  return <main className="page max-w-3xl">
    <ReaderBackButton fallback="/hymns/new-translations?section=yp" label="Back to YP New Songs"/>
    <header className="mb-8">
      <p className="eyebrow normal-case">New YP Song{sourceLabel?` • ${sourceLabel}`:""}</p>
      <h1 className="myanmar mt-2 font-serif text-3xl leading-tight tracking-tight md:text-4xl">{item.title}</h1>
    </header>

    <TranslationGuitarReader sections={sections} apiUrl={`/api/new-yp-translation-guitar/${item.id}`} sourceLabel={sourceLabel??"New YP Song"}/>
    <p className="mt-5 flex items-center gap-2 text-sm font-bold text-[var(--gold)]"><WifiOff size={16}/>Audio and uncached guitar data require internet.</p>

    <nav className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-5 text-sm font-semibold" aria-label="New YP song navigation">
      {previous?<Link href={`/yp/new-translations/${previous.id}`}>← {compactSourceRef(previous.source_ref)??"Previous"}</Link>:<span/>}
      {next?<Link href={`/yp/new-translations/${next.id}`}>{compactSourceRef(next.source_ref)??"Next"} →</Link>:<span/>}
    </nav>
  </main>;
}

export function OfflineNewTranslationsRoute({pathname}:{pathname:string}){
  const [items,setItems]=useState<OfflineNewTranslation[]>([]);
  const [ypItems,setYpItems]=useState<OfflineNewYpTranslation[]>([]);
  const [ready,setReady]=useState(false);
  const [initialSection,setInitialSection]=useState<"hymns"|"yp">("hymns");

  useEffect(()=>{
    setInitialSection(new URLSearchParams(location.search).get("section")==="yp"?"yp":"hymns");
    let active=true;
    Promise.all([readOfflineNewTranslations(),readOfflineNewYpTranslations()]).then(([storedHymns,storedYp])=>{
      if(active){setItems(storedHymns);setYpItems(storedYp);setReady(true)}
    }).catch(()=>{if(active)setReady(true)});
    return()=>{active=false};
  },[pathname]);

  const hymnSummaries=useMemo(()=>items.map(hymnSummary),[items]);
  const ypSummaries=useMemo(()=>ypItems.map(ypSummary),[ypItems]);

  if(!ready)return <main className="page"><p className="text-sm font-bold text-[var(--muted)]">Loading offline new translations…</p></main>;

  if(pathname==="/hymns/new-translations"){
    return <NewTranslationBrowser items={hymnSummaries} ypItems={ypSummaries} initialSection={initialSection} hideCollectionOptions/>;
  }

  const hymnMatch=pathname.match(/^\/hymns\/new-translations\/([^/]+)$/);
  if(hymnMatch){
    const id=decodeURIComponent(hymnMatch[1]);
    const item=items.find(candidate=>candidate.id===id||String(candidate.english_number)===id);
    return item?<OfflineHymnTranslationReader item={item} items={items}/>:<main className="page"><p className="font-serif text-2xl">Translation not found</p></main>;
  }

  const ypMatch=pathname.match(/^\/yp\/new-translations\/([^/]+)$/);
  if(ypMatch){
    const id=decodeURIComponent(ypMatch[1]);
    const item=ypItems.find(candidate=>candidate.id===id);
    return item?<OfflineYpTranslationReader item={item} items={ypItems}/>:<main className="page"><p className="font-serif text-2xl">YP song not found</p></main>;
  }

  return <NewTranslationBrowser items={hymnSummaries} ypItems={ypSummaries} initialSection={initialSection} hideCollectionOptions/>;
}
