import Link from "next/link";
import { notFound } from "next/navigation";
import { OnlineAudio } from "@/components/online-audio";
import { TranslationGuitarReader } from "@/components/translation-guitar-reader";
import { getNewYpAudioUrl,getNewYpTranslation,getNewYpTranslations } from "@/lib/hymns/new-yp-translations";
import { parseNewYpTranslationLines } from "@/lib/hymns/translation-display";

const VERIFIED_NEW_YP_GUITAR_IDS=new Set([
  "ns-294","ns-931","ns-970","ns-655","ns-1053",
  "ns-972","ns-356","ns-1058","ns-835","ns-181",
]);

export function generateStaticParams(){
  return getNewYpTranslations().map(item=>({id:item.id}));
}

export default async function NewYpTranslationPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const song=getNewYpTranslation(id);
  if(!song)notFound();

  const all=getNewYpTranslations();
  const index=all.findIndex(item=>item.id===song.id);
  const previous=index>0?all[index-1]:undefined;
  const next=index>=0&&index<all.length-1?all[index+1]:undefined;
  const audioUrl=getNewYpAudioUrl(song);
  const sections=parseNewYpTranslationLines(song.raw_lines);
  const hasGuitarSource=VERIFIED_NEW_YP_GUITAR_IDS.has(song.id);

  return <main className="page max-w-3xl">
    <Link href="/hymns/new-translations?section=yp" className="focus-ring mb-5 inline-flex rounded-lg text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">← Back to YP New Songs</Link>
    <header className="mb-8">
      <p className="eyebrow normal-case">New YP Song{song.source_ref?` • ${song.source_ref}`:""}</p>
      <h1 className="myanmar mt-2 font-serif text-3xl leading-tight tracking-tight md:text-4xl">{song.title}</h1>
    </header>

    {hasGuitarSource?<TranslationGuitarReader sections={sections} apiUrl={`/api/new-yp-translation-guitar/${song.id}`} sourceLabel={song.source_ref??`${song.source_kind} ${song.source_number}`}/>:<div className="myanmar space-y-1 text-[17px] leading-8">{song.raw_lines.map((line,lineIndex)=>line.trim()===""?<div key={lineIndex} className="h-4"/>:<div key={lineIndex} className="whitespace-pre-wrap">{line}</div>)}</div>}

    {audioUrl&&<div className="mt-9"><OnlineAudio src={audioUrl}/></div>}

    <nav className="mt-12 flex items-center justify-between border-t border-[var(--line)] pt-5 text-sm font-semibold" aria-label="New YP song navigation">
      {previous?<Link href={`/yp/new-translations/${previous.id}`}>← {previous.source_ref??"Previous"}</Link>:<span/>}
      {next?<Link href={`/yp/new-translations/${next.id}`}>{next.source_ref??"Next"} →</Link>:<span/>}
    </nav>
  </main>;
}
