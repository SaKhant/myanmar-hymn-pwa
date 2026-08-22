"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, WifiOff } from "lucide-react";
import { HymnBrowser } from "@/components/hymn-browser";
import { OfflineGuitarReader } from "@/components/offline-guitar-reader";
import { YpGuitarReader } from "@/components/yp-guitar-reader";
import { ypSourceLabel } from "@/lib/hymns/yp-sources";
import { OfflineLocalHymnReader, OfflineMatuHymnBrowser } from "@/components/offline-local-hymns";
import { ReaderActions } from "@/components/reader-actions";
import { ReaderBackButton } from "@/components/reader-back-button";
import { OFFLINE_NAVIGATION_EVENT, OFFLINE_SCROLL_STATE } from "@/components/offline-navigation";
import { StoredList } from "@/components/stored-list";
import { normalizeSearchText } from "@/lib/hymns/search";
import { clearOfflineLibrarySnapshot, readOfflineHymns, readOfflineCategories, readOfflineLibraryMeta, readOfflineLibrarySnapshot, writeOfflineLibrarySnapshotFromRecords, type OfflineHymn, type OfflineLibrarySnapshot, type OfflineSnapshotSummary } from "@/lib/offline-library";
import type { HymnCategory, HymnKind, HymnLanguage, HymnSummary } from "@/lib/hymns/types";
import { CategoriesBrowser } from "@/components/categories-browser";

function collection(kind:HymnKind,language:HymnLanguage){return `${language==="my"?"myanmar":"english"}_${kind}`}
function title(hymn:OfflineHymn){return hymn.title?.trim()||hymn.first_line?.trim()||`Hymn ${hymn.number??hymn.id}`}
function hymnNumber(hymn:OfflineHymn){return String(hymn.number??hymn.id)}
function toSummary(hymn:OfflineHymn,kind:HymnKind):HymnSummary{
  const lyricSections=hymn.sections.flatMap(section=>section.lines).join(" ");
  const fields=hymn.language==="my"?[hymn.number,title(hymn),hymn.first_line,hymn.lyrics_text,lyricSections]:[hymn.number,title(hymn),hymn.first_line,hymn.theme,hymn.lyrics_text,lyricSections];
  return {id:hymn.id,number:hymn.number,collection:hymn.collection,language:hymn.language,kind,title:title(hymn),firstLine:hymn.first_line?.trim()||"",theme:hymn.theme?.trim()||"",searchText:normalizeSearchText(fields.filter(Boolean).join(" ")),lyricSearchText:normalizeSearchText([hymn.lyrics_text,lyricSections].filter(Boolean).join(" "))};
}
function englishReferenceNumber(reference:string|undefined){return reference?.match(/^(\d+)(?:\(\d+\))?$/)?.[1]}
function ypReferenceNumber(reference:string|undefined){return reference?.match(/^(\d+)$/)?.[1]}
const CHORD_TOKEN=/^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?$/i;
function isChordOnlyLine(line:string){const tokens=line.trim().replace(/[|,:()\-–—]/g," ").split(/\s+/).filter(Boolean);return tokens.length>0&&tokens.every(token=>CHORD_TOKEN.test(token))}

function OfflineReader({hymn,hymns,kind,language}:{hymn:OfflineHymn;hymns:OfflineHymn[];kind:HymnKind;language:HymnLanguage}){
  const isMyanmar=language==="my";
  const heading=title(hymn);
  const reference=isMyanmar&&kind==="hymns"?hymn.cross_references.Eng?.trim():undefined;
  const englishNumber=englishReferenceNumber(reference);
  const englishHymn=englishNumber?hymns.find(item=>item.collection==="english_hymns"&&String(item.number??item.id)===englishNumber):undefined;
  const relatedMyanmar=!isMyanmar&&kind==="hymns"?hymns.find(item=>item.collection==="myanmar_hymns"&&englishReferenceNumber(item.cross_references.Eng?.trim())===String(hymn.number??hymn.id)):undefined;
  const relatedYp=kind==="yp"?hymns.find(item=>item.collection===collection("yp",isMyanmar?"en":"my")&&String(item.number??item.id)===String(hymn.number??hymn.id)):undefined;
  const versionMyanmar=kind==="hymns"?(isMyanmar?hymn:relatedMyanmar):undefined;
  const versionMyanmarNumber=versionMyanmar?hymnNumber(versionMyanmar):undefined;
  const relatedKachin=versionMyanmarNumber?hymns.find(item=>String(item.collection)==="kachin_hymns"&&item.cross_references.Myanmar?.trim()===versionMyanmarNumber):undefined;
  const relatedMatu=versionMyanmarNumber?hymns.find(item=>String(item.collection)==="matu_hymns"&&hymnNumber(item)===versionMyanmarNumber):undefined;
  const index=hymns.filter(item=>item.collection===hymn.collection).findIndex(item=>item.id===hymn.id);
  const sameCollection=hymns.filter(item=>item.collection===hymn.collection);
  const previous=index>0?sameCollection[index-1]:undefined;
  const next=index>=0&&index<sameCollection.length-1?sameCollection[index+1]:undefined;
  const hasDetails=Object.keys(hymn.metadata).length>0;
  const ypLabel=kind==="yp"?ypSourceLabel(hymn.number):undefined;
  return <main className="page reader-page">
    {kind==="hymns"?<ReaderBackButton fallback="/" label="Back to Hymns"/>:<Link href="/yp" className="focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-[var(--muted)]"><ArrowLeft size={15}/>Back to YP Songs</Link>}
    <article><header className="border-b border-[var(--line)] pb-5">
      <p className="eyebrow reader-kicker">
        {kind==="hymns"&&isMyanmar&&<Link replace href={`/hymns/my/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">M{hymn.number??hymn.id}</Link>}
        {kind==="hymns"&&isMyanmar&&reference&&<><span className="reader-version-separator">•</span>{englishHymn?<Link replace href={`/hymns/en/${englishHymn.id}`} className="reader-version-link focus-ring">E{reference}</Link>:<span className="reader-version-reference">E{reference}</span>}</>}
        {kind==="hymns"&&!isMyanmar&&relatedMyanmar&&<><Link replace href={`/hymns/my/${relatedMyanmar.id}`} className="reader-version-link focus-ring">M{relatedMyanmar.number??relatedMyanmar.id}</Link><span className="reader-version-separator">•</span></>}
        {kind==="hymns"&&!isMyanmar&&<Link replace href={`/hymns/en/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">E{relatedMyanmar?.cross_references.Eng?.trim()||hymn.number||hymn.id}</Link>}
        {kind==="hymns"&&relatedKachin&&<><span className="reader-version-separator">•</span><Link href={`/hymns/kachin/${hymnNumber(relatedKachin)}`} className="reader-version-link focus-ring">KC{hymnNumber(relatedKachin)}</Link></>}
        {kind==="hymns"&&relatedMatu&&<><span className="reader-version-separator">•</span><Link href={`/hymns/matu/${hymnNumber(relatedMatu)}`} className="reader-version-link focus-ring">MT{hymnNumber(relatedMatu)}</Link></>}
        {kind==="yp"&&isMyanmar&&<Link href={`/yp/my/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">MY {hymn.number??hymn.id}</Link>}
        {kind==="yp"&&isMyanmar&&relatedYp&&<><span className="reader-version-separator">•</span><Link href={`/yp/en/${relatedYp.id}`} className="reader-version-link focus-ring">ENG {relatedYp.number??relatedYp.id}</Link></>}
        {kind==="yp"&&!isMyanmar&&relatedYp&&<><Link href={`/yp/my/${relatedYp.id}`} className="reader-version-link focus-ring">MY {relatedYp.number??relatedYp.id}</Link><span className="reader-version-separator">•</span></>}
        {kind==="yp"&&!isMyanmar&&<Link href={`/yp/en/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">ENG {hymn.number??hymn.id}</Link>}
      </p>
      <h1 className={isMyanmar?`reader-title-myanmar mt-2 ${Array.from(heading).length>32?"reader-title-myanmar-long":""}`:"mt-2 font-serif text-3xl leading-snug tracking-tight md:text-5xl"}>{heading}</h1>
      {hymn.theme&&<p className={`mt-2.5 text-sm text-[var(--muted)] ${isMyanmar?"myanmar":""}`}>{hymn.theme}</p>}
      <div className="mt-4"><ReaderActions hymn={{id:hymn.id,kind,language,number:hymn.number,title:heading,sections:hymn.sections}}/></div>
    </header>
    {kind==="hymns"&&isMyanmar?<OfflineGuitarReader hymn={hymn}/>:ypLabel&&Number.isInteger(hymn.number)?<YpGuitarReader sections={hymn.sections} ypNumber={hymn.number!} sourceLabel={ypLabel} unavailableMessage="Open this song once with internet to save its chords for offline use."/>:<div className={`mx-auto max-w-2xl py-7 ${isMyanmar?"reader-lyrics-myanmar":"leading-[1.8]"}`} style={isMyanmar?undefined:{fontSize:"var(--lyric-size,20px)"}}>{hymn.sections.map((section,index)=>{const chorus=section.type==="chorus"||section.type==="refrain";return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus?"border-l-2 border-[color-mix(in_srgb,var(--gold)_72%,transparent)] pl-4":""}`}><p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type==="verse"?`Verse ${section.number??""}`:section.type}</p><div className={isMyanmar?"myanmar":""}>{section.lines.map((line,lineIndex)=>kind==="yp"&&isChordOnlyLine(line)?null:<p key={lineIndex} className={isMyanmar?undefined:"min-h-[1.6em]"}>{line}</p>)}</div></section>})}</div>}
    {hasDetails&&<details className="group mb-7 border-t border-[var(--line)]"><summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center rounded-lg text-sm font-bold [&::-webkit-details-marker]:hidden">Hymn details<ChevronRight className="ml-auto text-[var(--muted)] transition-transform group-open:rotate-90" size={18}/></summary><div className={`grid gap-5 border-t border-[var(--line)] py-5 text-sm sm:grid-cols-2 ${isMyanmar?"myanmar":""}`}>{Object.entries(hymn.metadata).map(([key,value])=><p key={key} className="mb-1.5 text-[var(--muted)]"><span className="text-[var(--ink)]">{key}:</span> {value}</p>)}</div></details>}
    <p className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--gold)]"><WifiOff size={16}/>Internet connection required for audio.</p>
    <nav className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-6">{previous?<Link replace={kind==="hymns"} className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-[12px] border border-[var(--line)] px-3 py-2 text-sm font-bold" href={`/${kind}/${language}/${previous.id}`}><ArrowLeft size={17}/>Previous</Link>:<span aria-hidden="true"/>}{next?<Link replace={kind==="hymns"} className="focus-ring ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[12px] border border-[var(--line)] px-3 py-2 text-sm font-bold" href={`/${kind}/${language}/${next.id}`}>Next<ArrowRight size={17}/></Link>:<span aria-hidden="true"/>}</nav>
    </article>
  </main>;
}

function OfflineCategories({categories,hymns}:{categories:HymnCategory[];hymns:OfflineHymn[]}){const summaries=hymns.filter(hymn=>hymn.collection==="myanmar_hymns").map(hymn=>toSummary(hymn,"hymns"));return <main className="page"><ReaderBackButton fallback="/" label="သီချင်းများသို့ ပြန်သွားရန်"/><p className="eyebrow">မြန်မာဓမ္မသီချင်းစာအုပ်</p><h1 className="myanmar mt-2 font-serif text-4xl md:text-5xl">မာတိကာ ဇယား</h1><p className="myanmar mt-3 text-[var(--muted)]">အမျိုးအစားကိုရွေးပြီး အမျိုးအစားခွဲနှင့် သီချင်းများကို ကြည့်ရှုပါ။</p><CategoriesBrowser categories={categories} hymns={summaries}/></main>}

function OfflineRoute({hymns,categories,pathname}:{hymns:OfflineHymn[];categories:HymnCategory[];pathname:string}){
  const parts=pathname.split("/").filter(Boolean);
  if(!parts.length)return <HymnBrowser kind="hymns" myanmar={hymns.filter(hymn=>hymn.collection==="myanmar_hymns"&&Number.isInteger(hymn.number)).map(hymn=>toSummary(hymn,"hymns"))}/>;
  if(parts[0]==="yp"&&parts.length===1)return <HymnBrowser kind="yp" myanmar={hymns.filter(hymn=>hymn.collection==="myanmar_yp").map(hymn=>toSummary(hymn,"yp"))} myanmarOnly/>;
  if(parts[0]==="favorites")return <main className="page"><p className="eyebrow">Your collection</p><h1 className="mt-2 font-serif text-4xl md:text-5xl">Favorites</h1><StoredList/></main>;
  if(parts[0]==="settings")return <main className="page max-w-3xl"><h1 className="font-serif text-4xl md:text-5xl">Settings</h1><section className="surface mt-8 p-6"><h2 className="myanmar text-2xl font-bold">ဖုန်းတွင် App အဖြစ် ထည့်သွင်းရန်</h2><div className="mt-5 space-y-5 text-base leading-7 text-[var(--muted)]"><div><h3 className="font-bold text-[var(--ink)]">Android</h3><p className="myanmar mt-1">Chrome ဖြင့် ဝဘ်ဆိုဒ်ကိုဖွင့်ပါ → ⋮ ကိုနှိပ်ပါ → Install app သို့မဟုတ် Add to Home screen ကိုရွေးပါ။</p></div><div><h3 className="font-bold text-[var(--ink)]">iPhone / iPad</h3><p className="myanmar mt-1">Safari ဖြင့် ဝဘ်ဆိုဒ်ကိုဖွင့်ပါ → Share ⬆️ ကိုနှိပ်ပါ → Add to Home Screen → Add ကိုနှိပ်ပါ။</p></div><p className="myanmar">ထည့်သွင်းပြီးနောက် ပုံမှန် App တစ်ခုကဲ့သို့ Home Screen မှ တိုက်ရိုက်ဖွင့်နိုင်ပါသည်။</p></div></section><p className="mt-6 text-center text-base font-bold text-[var(--muted)]">Audio need internet or wifi.</p></main>;
  if(parts[0]==="categories")return <OfflineCategories categories={categories} hymns={hymns}/>;
  if((parts[0]==="hymns"&&parts[1]==="matu"&&parts.length===2)||(parts[0]==="matu-hymns"&&parts.length===1))return <OfflineMatuHymnBrowser hymns={hymns}/>;
  if(parts[0]==="hymns"&&(parts[1]==="kachin"||parts[1]==="matu")&&parts[2]){const language=parts[1] as "kachin"|"matu";const collectionName=language==="kachin"?"kachin_hymns":"matu_hymns";const id=decodeURIComponent(parts[2]);const hymn=hymns.find(item=>String(item.collection)===collectionName&&(item.id===id||hymnNumber(item)===id));return hymn?<OfflineLocalHymnReader hymn={hymn} hymns={hymns} language={language}/>:<main className="page"><p className="font-serif text-2xl">Hymn not found</p></main>}
  if(parts[0]==="matu-hymns"&&parts[1]){const id=decodeURIComponent(parts[1]);const hymn=hymns.find(item=>String(item.collection)==="matu_hymns"&&(item.id===id||hymnNumber(item)===id));return hymn?<OfflineLocalHymnReader hymn={hymn} hymns={hymns} language="matu"/>:<main className="page"><p className="font-serif text-2xl">Hymn not found</p></main>}
  if((parts[0]==="hymns"||parts[0]==="yp")&&(parts[1]==="my"||parts[1]==="en")&&parts[2]){const kind=parts[0] as HymnKind,language=parts[1] as HymnLanguage;const hymn=hymns.find(item=>item.collection===collection(kind,language)&&(item.id===decodeURIComponent(parts[2])||String(item.number)===decodeURIComponent(parts[2])));return hymn?<OfflineReader hymn={hymn} hymns={hymns} kind={kind} language={language}/>:<main className="page"><p className="font-serif text-2xl">Hymn not found</p></main>}
  return <HymnBrowser kind="hymns" myanmar={hymns.filter(hymn=>hymn.collection==="myanmar_hymns"&&Number.isInteger(hymn.number)).map(hymn=>toSummary(hymn,"hymns"))}/>;
}

function snapshotToSummary(summary:OfflineSnapshotSummary,kind:HymnKind):HymnSummary{
  return {id:summary.id,number:summary.number,collection:kind==="yp"?"myanmar_yp":"myanmar_hymns",language:"my",kind,title:summary.title,firstLine:summary.firstLine,theme:summary.theme,searchText:"",lyricSearchText:""};
}

export function OfflineApp(){
  const [offline,setOffline]=useState(false),[ready,setReady]=useState(false),[pathname,setPathname]=useState("/"),[hymns,setHymns]=useState<OfflineHymn[]>([]),[categories,setCategories]=useState<HymnCategory[]>([]),[snapshot,setSnapshot]=useState<OfflineLibrarySnapshot|null>(()=>typeof navigator==="undefined"||navigator.onLine?null:readOfflineLibrarySnapshot());
  const containerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const sync=()=>setOffline(!navigator.onLine);sync();window.addEventListener("online",sync);window.addEventListener("offline",sync);return()=>{window.removeEventListener("online",sync);window.removeEventListener("offline",sync)}},[]);
  useEffect(()=>{const sync=()=>setPathname(location.pathname);sync();window.addEventListener("popstate",sync);window.addEventListener(OFFLINE_NAVIGATION_EVENT,sync);return()=>{window.removeEventListener("popstate",sync);window.removeEventListener(OFFLINE_NAVIGATION_EVENT,sync)}},[]);
  useEffect(()=>{
    if(!offline)return;
    let active=true;
    Promise.all([readOfflineLibraryMeta(),readOfflineHymns(),readOfflineCategories()]).then(([meta,records,storedCategories])=>{
      if(!active)return;
      if(meta){
        setHymns(records);setCategories(storedCategories);
        const stored=readOfflineLibrarySnapshot();
        if(!stored||stored.version!==meta.version)writeOfflineLibrarySnapshotFromRecords(meta.version,records);
      }
      else clearOfflineLibrarySnapshot();
      setReady(true);
    }).catch(()=>{if(active)setReady(true)});
    return()=>{active=false};
  },[offline]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>containerRef.current?.scrollTo(0,Number(history.state?.[OFFLINE_SCROLL_STATE])||0));return()=>cancelAnimationFrame(frame)},[pathname]);
  const preview=useMemo(()=>snapshot?{myanmar:snapshot.myanmarHymns.map(item=>snapshotToSummary(item,"hymns")),yp:snapshot.myanmarYp.map(item=>snapshotToSummary(item,"yp"))}:null,[snapshot]);
  const route=useMemo(()=>{
    if(ready)return <OfflineRoute hymns={hymns} categories={categories} pathname={pathname}/>;
    const parts=pathname.split("/").filter(Boolean);
    if(preview&&parts.length===0)return <HymnBrowser kind="hymns" myanmar={preview.myanmar}/>;
    if(preview&&parts[0]==="yp"&&parts.length===1)return <HymnBrowser kind="yp" myanmar={preview.yp} myanmarOnly/>;
    return <main className="page"><p className="text-sm font-bold text-[var(--muted)]">Loading offline library…</p></main>;
  },[categories,hymns,pathname,ready,preview]);
  if(!offline)return null;
  return <div ref={containerRef} className="offline-app fixed inset-0 z-20 overflow-y-auto bg-[var(--paper)]">{route}</div>;
}
