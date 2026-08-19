import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { ReaderActions } from "@/components/reader-actions";
import { OnlineAudio } from "@/components/online-audio";
import { GuitarReader } from "@/components/guitar-reader";
import { RemoteHymnGuitarReader } from "@/components/hymn-remote-guitar-reader";
import { YpGuitarReader } from "@/components/yp-guitar-reader";
import { ReaderBackButton } from "@/components/reader-back-button";
import { getAdjacentHymns, getHymn, getHymns } from "@/lib/hymns/data";
import { getGuitarArrangement } from "@/lib/hymns/guitar-data";
import { ypAudioUrl, ypSource, ypSourceLabel } from "@/lib/hymns/yp-sources";
import type { HymnKind, HymnLanguage } from "@/lib/hymns/types";

function englishReferenceNumber(reference: string | undefined): string | undefined {
  return reference?.match(/^(\d+)(?:\(\d+\))?$/)?.[1];
}

function validAudioUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url=new URL(value);
    return url.protocol==="http:"||url.protocol==="https:"?value:undefined;
  } catch {
    return undefined;
  }
}

const CHORD_TOKEN=/^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?$/i;

function isChordOnlyLine(line:string):boolean {
  const tokens=line.trim().replace(/[|,:()\-–—]/g," ").split(/\s+/).filter(Boolean);
  return tokens.length>0&&tokens.every(token=>CHORD_TOKEN.test(token));
}

export default async function HymnPage({params,searchParams}:{params:Promise<{kind:string;language:string;id:string}>;searchParams:Promise<{from?:string}>}) {
  const p=await params;
  const query=await searchParams;
  if(!["hymns","yp"].includes(p.kind)||!["my","en"].includes(p.language)) notFound();
  const kind=p.kind as HymnKind, language=p.language as HymnLanguage;
  const hymn=getHymn(kind,language,p.id);
  if(!hymn) notFound();
  const adjacent=getAdjacentHymns(kind,language,p.id);
  const title=hymn.title||hymn.first_line||`Hymn ${hymn.number??hymn.id}`;
  const isMyanmar=language==="my";
  const englishReference=isMyanmar&&kind==="hymns"?hymn.cross_references.Eng?.trim():undefined;
  const englishTargetNumber=englishReferenceNumber(englishReference);
  const englishReferenceTarget=englishTargetNumber?getHymn("hymns","en",englishTargetNumber):undefined;
  const referringMyanmarHymn=!isMyanmar&&kind==="hymns"&&query.from?getHymn("hymns","my",query.from):undefined;
  const validatedMyanmarHymn=referringMyanmarHymn&&englishReferenceNumber(referringMyanmarHymn.cross_references.Eng?.trim())===String(hymn.number??hymn.id)?referringMyanmarHymn:undefined;
  const discoveredMyanmarHymn=!isMyanmar&&kind==="hymns"?getHymns("hymns","my").find(candidate=>englishReferenceNumber(candidate.cross_references.Eng?.trim())===String(hymn.number??hymn.id)):undefined;
  const relatedMyanmarHymn=validatedMyanmarHymn??discoveredMyanmarHymn;
  const englishVersionLabel=relatedMyanmarHymn?.cross_references.Eng?.trim()||hymn.number||hymn.id;
  const relatedYpSong=kind==="yp"?getHymn("yp",isMyanmar?"en":"my",String(hymn.number??hymn.id)):undefined;
  const regularYpSourceLabel=kind==="yp"?ypSourceLabel(hymn.number??hymn.id):undefined;
  const regularYpAudio=kind==="yp"?ypAudioUrl(hymn.number??hymn.id):undefined;
  const ypNumber=kind==="yp"?Number(hymn.number??hymn.id):undefined;
  const verifiedYpSource=kind==="yp"&&isMyanmar&&ypNumber!==undefined?ypSource(ypNumber):undefined;
  const audioUrl=validAudioUrl(hymn.audio_url)??regularYpAudio??(!isMyanmar?validAudioUrl(relatedMyanmarHymn?.audio_url):undefined);
  const hasLongTitle=Array.from(title).length>32;
  const hasDetails=Object.keys(hymn.metadata).length>0;
  const guitarArrangement=getGuitarArrangement(hymn);
  const remoteHymnNumber=kind==="hymns"&&isMyanmar&&typeof hymn.number==="number"&&hymn.number>=111&&hymn.number<=200?hymn.number:undefined;
  const remoteHymnSourceLabel=remoteHymnNumber!==undefined&&englishTargetNumber&&englishReferenceTarget?`E${englishTargetNumber}`:undefined;
  const numberedNotesImageSrc=kind==="hymns"&&isMyanmar&&hymn.number===1?"/jianpu/myanmar-hymn-1.png":undefined;

  return <main className="page reader-page">
    {kind==="hymns"?<ReaderBackButton fallback="/" label="Back to Hymns"/>:<Link href="/yp" className="focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-[var(--muted)]"><ArrowLeft size={15}/>Back to YP Songs</Link>}
    <article>
      <header className="border-b border-[var(--line)] pb-5">
        <p className="eyebrow reader-kicker">
          {kind==="hymns"&&isMyanmar&&<Link replace href={`/hymns/my/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">M{hymn.number??hymn.id}</Link>}
          {kind==="hymns"&&!isMyanmar&&relatedMyanmarHymn&&<><Link replace href={`/hymns/my/${relatedMyanmarHymn.id}`} className="reader-version-link focus-ring">M{relatedMyanmarHymn.number??relatedMyanmarHymn.id}</Link><span className="reader-version-separator">•</span></>}
          {kind==="hymns"&&isMyanmar&&englishReference&&<><span className="reader-version-separator">•</span>{englishReferenceTarget?<Link replace href={`/hymns/en/${englishReferenceTarget.id}?from=${encodeURIComponent(hymn.id)}`} className="reader-version-link focus-ring">E{englishReference}</Link>:<span className="reader-version-reference">E{englishReference}</span>}</>}
          {kind==="hymns"&&!isMyanmar&&<Link replace href={`/${kind}/${language}/${hymn.id}${relatedMyanmarHymn?`?from=${encodeURIComponent(relatedMyanmarHymn.id)}`:""}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">E{englishVersionLabel}</Link>}
          {kind==="yp"&&isMyanmar&&<Link href={`/yp/my/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">YP{hymn.number??hymn.id}</Link>}
          {kind==="yp"&&isMyanmar&&relatedYpSong&&<><span className="reader-version-separator">•</span><Link href={`/yp/en/${relatedYpSong.id}`} className="reader-version-link focus-ring">{regularYpSourceLabel??"ENG"}</Link></>}
          {kind==="yp"&&!isMyanmar&&relatedYpSong&&<><Link href={`/yp/my/${relatedYpSong.id}`} className="reader-version-link focus-ring">YP{relatedYpSong.number??relatedYpSong.id}</Link><span className="reader-version-separator">•</span></>}
          {kind==="yp"&&!isMyanmar&&<Link href={`/yp/en/${hymn.id}`} aria-current="page" className="reader-current-version reader-version-link focus-ring">{regularYpSourceLabel??"ENG"}</Link>}
        </p>
        <h1 className={isMyanmar?`reader-title-myanmar mt-2 ${hasLongTitle?"reader-title-myanmar-long":""}`:"mt-2 font-serif text-3xl leading-snug tracking-tight md:text-5xl"}>{title}</h1>
        {hymn.theme&&<p className={`mt-2.5 text-sm text-[var(--muted)] ${isMyanmar?"myanmar":""}`}>{hymn.theme}</p>}
        <div className="mt-4"><ReaderActions hymn={{id:hymn.id,kind,language,number:hymn.number,title,sections:hymn.sections}}/></div>
      </header>

      {guitarArrangement?<GuitarReader sections={hymn.sections} arrangement={guitarArrangement} numberedNotesImageSrc={numberedNotesImageSrc}/>:remoteHymnNumber!==undefined&&remoteHymnSourceLabel?<RemoteHymnGuitarReader sections={hymn.sections} hymnNumber={remoteHymnNumber} sourceLabel={remoteHymnSourceLabel}/>:verifiedYpSource&&regularYpSourceLabel&&ypNumber!==undefined?<YpGuitarReader sections={hymn.sections} ypNumber={ypNumber} sourceLabel={regularYpSourceLabel}/>:<div className={`mx-auto max-w-2xl py-7 ${isMyanmar?"reader-lyrics-myanmar":"leading-[1.8]"}`} style={isMyanmar?undefined:{fontSize:"var(--lyric-size,20px)"}}>
        {hymn.sections.map((section,index)=>{
          const chorus=section.type==="chorus"||section.type==="refrain";
          return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus?"border-l-2 border-[color-mix(in_srgb,var(--gold)_72%,transparent)] pl-4":""}`}>
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type==="verse"?`Verse ${section.number??""}`:section.type}</p>
            <div className={isMyanmar?"myanmar":""}>{section.lines.map((line,i)=>kind==="yp"&&isChordOnlyLine(line)?null:<p key={i} className={isMyanmar?undefined:"min-h-[1.6em]"}>{line}</p>)}</div>
          </section>;
        })}
      </div>}

      {hasDetails&&<details className="group mb-7 border-t border-[var(--line)]">
        <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center rounded-lg text-sm font-bold [&::-webkit-details-marker]:hidden">Hymn details<ChevronRight className="ml-auto text-[var(--muted)] transition-transform group-open:rotate-90" size={18}/></summary>
        <div className={`grid gap-5 border-t border-[var(--line)] py-5 text-sm sm:grid-cols-2 ${isMyanmar?"myanmar":""}`}>
          {Object.keys(hymn.metadata).length>0&&<div>{Object.entries(hymn.metadata).map(([key,value])=><p key={key} className="mb-1.5 text-[var(--muted)]"><span className="text-[var(--ink)]">{key}:</span> {value}</p>)}</div>}
        </div>
      </details>}

      {audioUrl&&<OnlineAudio src={audioUrl}/>}

      <nav className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-6">
        {adjacent.previous?<Link replace={kind==="hymns"} className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-[12px] border border-[var(--line)] px-3 py-2 text-sm font-bold" href={`/${kind}/${language}/${adjacent.previous.id}`}><ArrowLeft size={17}/>Previous</Link>:<span aria-hidden="true"/>}
        {adjacent.next?<Link replace={kind==="hymns"} className="focus-ring ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[12px] border border-[var(--line)] px-3 py-2 text-sm font-bold" href={`/${kind}/${language}/${adjacent.next.id}`}>Next<ArrowRight size={17}/></Link>:<span aria-hidden="true"/>}
      </nav>
    </article>
  </main>;
}
