import Link from "next/link";
import { notFound } from "next/navigation";
import { ReaderBackButton } from "@/components/reader-back-button";
import { TranslationGuitarReader } from "@/components/translation-guitar-reader";
import { getHymn } from "@/lib/hymns/data";
import { getNewMyanmarTranslation,getNewMyanmarTranslations } from "@/lib/hymns/new-translations";
import { parseNumberedTranslationLines } from "@/lib/hymns/translation-display";
import styles from "./page.module.css";

export function generateStaticParams(){return getNewMyanmarTranslations().map(item=>({id:String(item.english_number)}))}

export default async function NewTranslationPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const hymn=getNewMyanmarTranslation(id);
  if(!hymn)notFound();
  const english=getHymn("hymns","en",String(hymn.english_number));
  const all=getNewMyanmarTranslations();
  const index=all.findIndex(item=>item.id===hymn.id);
  const previous=index>0?all[index-1]:undefined;
  const next=index>=0&&index<all.length-1?all[index+1]:undefined;
  const sections=parseNumberedTranslationLines(hymn.raw_lines);

  return <main className={styles.page}>
    <ReaderBackButton fallback="/hymns/new-translations" label="Back to New Translations"/>
    <p className={styles.kicker}>
      <span className={styles.current}>MYANMAR TRANSLATION</span>
      {" • "}
      {english?<Link href={`/hymns/en/${hymn.english_number}`}>E{hymn.english_number}</Link>:<span>E{hymn.english_number}</span>}
    </p>
    <h1 className={`${styles.title} myanmar`}>{hymn.title}</h1>
    <p className={`${styles.meta} myanmar`}>{hymn.category}{hymn.meter?` • ${hymn.meter}`:""}</p>
    {hymn.english_title?<p className={styles.meta}>{hymn.english_title}</p>:null}
    {hymn.source_note?<p className={styles.note}>{hymn.source_note}</p>:null}

    <TranslationGuitarReader sections={sections} apiUrl={`/api/new-translation-guitar/${hymn.english_number}`} sourceLabel={`E${hymn.english_number}`}/>

    <nav className={styles.nav} aria-label="Translation navigation">
      {previous?<Link href={`/hymns/new-translations/${previous.english_number}`}>← E{previous.english_number}</Link>:<span className={styles.navSpacer}/>} 
      {next?<Link href={`/hymns/new-translations/${next.english_number}`}>E{next.english_number} →</Link>:<span className={styles.navSpacer}/>} 
    </nav>
  </main>;
}
