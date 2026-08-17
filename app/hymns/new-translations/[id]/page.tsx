import Link from "next/link";
import { notFound } from "next/navigation";
import { getHymn } from "@/lib/hymns/data";
import { getNewMyanmarTranslation,getNewMyanmarTranslations } from "@/lib/hymns/new-translations";
import styles from "./page.module.css";

const BURMESE_DIGITS:Record<string,string>={"၀":"0","၁":"1","၂":"2","၃":"3","၄":"4","၅":"5","၆":"6","၇":"7","၈":"8","၉":"9"};

function toArabicDigits(value:string){return value.replace(/[၀-၉]/g,digit=>BURMESE_DIGITS[digit]??digit)}
function leadingTabs(value:string){return value.match(/^\t*/)?.[0].length??0}

type DisplaySection={number:number|null;lines:string[]};
function splitSections(rawLines:string[]):DisplaySection[]{
  const sections:DisplaySection[]=[];
  let current:DisplaySection|null=null;
  for(const raw of rawLines){
    const match=raw.match(/^\s*([၀-၉0-9]+)[။.]\s*(.*)$/);
    if(match){
      if(current)sections.push(current);
      current={number:Number(toArabicDigits(match[1])),lines:[match[2]]};
    }else if(current){
      current.lines.push(raw);
    }else if(raw.trim()){
      current={number:null,lines:[raw]};
    }
  }
  if(current)sections.push(current);
  return sections;
}

function baseIndent(lines:string[]){
  const candidates=lines.slice(1).filter(line=>line.trim()&&line.trim()!=="...").map(leadingTabs);
  if(!candidates.length)return 0;
  const counts=new Map<number,number>();
  candidates.forEach(value=>counts.set(value,(counts.get(value)??0)+1));
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0][0];
}

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
  const sections=splitSections(hymn.raw_lines);

  return <main className={styles.page}>
    <Link className={styles.back} href="/hymns/new-translations">← Back to New Translations</Link>
    <p className={styles.kicker}>
      <span className={styles.current}>MYANMAR TRANSLATION</span>
      {" • "}
      {english?<Link href={`/hymns/en/${hymn.english_number}`}>ENG {hymn.english_number}</Link>:<span>ENG {hymn.english_number}</span>}
    </p>
    <h1 className={`${styles.title} myanmar`}>{hymn.title}</h1>
    <p className={`${styles.meta} myanmar`}>{hymn.category}{hymn.meter?` • ${hymn.meter}`:""}</p>
    {hymn.english_title?<p className={styles.meta}>{hymn.english_title}</p>:null}
    {hymn.source_note?<p className={styles.note}>{hymn.source_note}</p>:null}

    <div>
      {sections.map((section,sectionIndex)=>{
        const base=baseIndent(section.lines);
        return <section className={styles.section} key={`${section.number??"text"}-${sectionIndex}`}>
          {section.number!==null?<div className={styles.badge} aria-label={`Verse ${section.number}`}>{section.number}</div>:null}
          <div className={`${styles.lines} myanmar`}>
            {section.lines.map((raw,lineIndex)=>{
              if(!raw.trim())return <div className={styles.blank} key={lineIndex}/>;
              const tabs=leadingTabs(raw);
              const extra=Math.max(0,tabs-base);
              return <div className={styles.line} style={extra?{paddingLeft:`${extra*1.5}rem`}:undefined} key={lineIndex}>{raw.replace(/^\t+/,"")}</div>;
            })}
          </div>
        </section>;
      })}
    </div>

    <nav className={styles.nav} aria-label="Translation navigation">
      {previous?<Link href={`/hymns/new-translations/${previous.english_number}`}>← ENG {previous.english_number}</Link>:<span className={styles.navSpacer}/>} 
      {next?<Link href={`/hymns/new-translations/${next.english_number}`}>ENG {next.english_number} →</Link>:<span className={styles.navSpacer}/>} 
    </nav>
  </main>;
}
