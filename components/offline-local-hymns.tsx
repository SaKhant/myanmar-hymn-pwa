"use client";

import Link from "next/link";
import MatuHymnBrowser from "@/components/matu-hymn-browser";
import type { OfflineHymn } from "@/lib/offline-library";
import styles from "@/app/matu-hymns/[id]/page.module.css";

type LocalLanguage="kachin"|"matu";

function collectionName(language:LocalLanguage){return language==="kachin"?"kachin_hymns":"matu_hymns"}
function hymnNumber(hymn:OfflineHymn){return String(hymn.number??hymn.id)}
function findByNumber(hymns:OfflineHymn[],collection:string,number:string|undefined){return number?hymns.find(item=>String(item.collection)===collection&&hymnNumber(item)===number):undefined}
function findKachinByMyanmar(hymns:OfflineHymn[],number:string|undefined){return number?hymns.find(item=>String(item.collection)==="kachin_hymns"&&item.cross_references.Myanmar?.trim()===number):undefined}

export function OfflineMatuHymnBrowser({hymns}:{hymns:OfflineHymn[]}){
  const items=hymns.filter(hymn=>String(hymn.collection)==="matu_hymns"&&hymn.number!==null).map(hymn=>({number:hymn.number as number,title:hymn.title||hymn.first_line||`Matu Hymn ${hymn.number}`}));
  return <MatuHymnBrowser hymns={items}/>;
}

export function OfflineLocalHymnReader({hymn,hymns,language}:{hymn:OfflineHymn;hymns:OfflineHymn[];language:LocalLanguage}){
  const currentCollection=collectionName(language);
  const sameCollection=hymns.filter(item=>String(item.collection)===currentCollection);
  const index=sameCollection.findIndex(item=>item.id===hymn.id);
  const previous=index>0?sameCollection[index-1]:undefined;
  const next=index>=0&&index<sameCollection.length-1?sameCollection[index+1]:undefined;
  const myanmarReference=hymn.cross_references.Myanmar?.trim()||(language==="matu"?hymnNumber(hymn):undefined);
  const myanmar=findByNumber(hymns,"myanmar_hymns",myanmarReference);
  const englishReference=hymn.cross_references.Eng?.trim()||myanmar?.cross_references.Eng?.trim();
  const english=findByNumber(hymns,"english_hymns",englishReference);
  const kachin=language==="kachin"?hymn:findKachinByMyanmar(hymns,myanmarReference);
  const matu=language==="matu"?hymn:findByNumber(hymns,"matu_hymns",myanmarReference);
  const heading=hymn.title||hymn.first_line||`${language==="kachin"?"Kachin":"Matu"} Hymn ${hymnNumber(hymn)}`;
  const basePath=language==="kachin"?"/hymns/kachin":"/hymns/matu";

  return <main className={styles.page}>
    <Link className={styles.back} href="/hymns">← Back to Hymns</Link>
    <p className={styles.kicker}>
      {myanmarReference?(myanmar?<Link href={`/hymns/my/${myanmar.id}`}>M{myanmarReference}</Link>:<span>M{myanmarReference}</span>):null}
      {englishReference?(english?<Link href={`/hymns/en/${english.id}${myanmar?`?from=${encodeURIComponent(myanmar.id)}`:""}`}>E{englishReference}</Link>:<span>E{englishReference}</span>):null}
      {kachin?(language==="kachin"?<span className={styles.current}>KC{hymnNumber(kachin)}</span>:<Link href={`/hymns/kachin/${hymnNumber(kachin)}`}>KC{hymnNumber(kachin)}</Link>):null}
      {matu?(language==="matu"?<span className={styles.current}>MT{hymnNumber(matu)}</span>:<Link href={`/hymns/matu/${hymnNumber(matu)}`}>MT{hymnNumber(matu)}</Link>):null}
    </p>
    <h1 className={styles.title}>{heading}</h1>
    <div>{hymn.sections.map((section,sectionIndex)=><section className={styles.section} key={`${section.type}-${section.number??sectionIndex}-${sectionIndex}`}>
      {section.type==="verse"&&section.number!==null?<div className={styles.badge} aria-label={`Verse ${section.number}`}>{section.number}</div>:null}
      <div className={`${styles.lines} ${section.type==="chorus"||section.type==="refrain"?styles.chorus:""}`}>{section.lines.map((line,lineIndex)=><div key={`${sectionIndex}-${lineIndex}`}>{line||"\u00a0"}</div>)}</div>
    </section>)}</div>
    <nav className={styles.nav} aria-label="Hymn navigation">
      {previous?<Link href={`${basePath}/${hymnNumber(previous)}`}>← Previous {hymnNumber(previous)}</Link>:<span className={styles.navSpacer}/>} 
      {next?<Link href={`${basePath}/${hymnNumber(next)}`}>Next {hymnNumber(next)} →</Link>:<span className={styles.navSpacer}/>} 
    </nav>
  </main>;
}
