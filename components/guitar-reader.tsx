"use client";

import { useState } from "react";
import type { GuitarLine, GuitarPhrase, GuitarReaderProps } from "@/lib/hymns/guitar-types";

function linePhrases(line:GuitarLine):GuitarPhrase[] {
  if(line.phrases)return line.phrases;
  const segments=line.segments??[];
  const breaks=[0,...(line.phraseBreaks??[]),segments.length];
  return breaks.slice(0,-1).map((start,index)=>({segments:segments.slice(start,breaks[index+1])})).filter((phrase)=>phrase.segments.length>0);
}

export function GuitarReader({ sections, arrangement }: GuitarReaderProps) {
  const [mode, setMode] = useState<"lyrics" | "guitar">("lyrics");

  return <>
    <div className="reader-mode-switch" role="group" aria-label="Reader display mode">
      <button type="button" aria-pressed={mode === "lyrics"} onClick={() => setMode("lyrics")}>Lyrics</button>
      <button type="button" aria-pressed={mode === "guitar"} onClick={() => setMode("guitar")}>Guitar</button>
    </div>

    {mode === "lyrics" ? <LyricsView sections={sections}/> : <div className="guitar-view">
      <div className="guitar-info" aria-label={`Original key ${arrangement.originalKey}, capo ${arrangement.capo}, play in ${arrangement.playKey}`}>
        <span>Key <strong>{arrangement.originalKeyDisplay}</strong></span><i aria-hidden="true">•</i>
        <span>Capo <strong>{arrangement.capo}</strong></span><i aria-hidden="true">•</i>
        <span>Play <strong>{arrangement.playKey}</strong></span>
      </div>
      {arrangement.verses.map((verse) => <section key={verse.number} className="guitar-verse">
        <p className="guitar-verse-number">{verse.number}</p>
        <div className="myanmar">
          {verse.lines.map((line, lineIndex) => <div className="guitar-line" key={lineIndex}>
            {linePhrases(line).map((phrase,phraseIndex)=><div className="guitar-phrase" key={phraseIndex}>
              {phrase.segments.map((segment, segmentIndex) => <span className="guitar-segment" key={segmentIndex}>
                <span className="guitar-chord" aria-label={segment.chord?`Chord ${segment.chord}`:undefined}>{segment.chord??"\u00a0"}</span>
                <span className="guitar-lyric-segment">{segment.text}</span>
              </span>)}
            </div>)}
          </div>)}
        </div>
      </section>)}
    </div>}
  </>;
}

function LyricsView({ sections }: Pick<GuitarReaderProps, "sections">) {
  return <div className="mx-auto max-w-2xl py-7 reader-lyrics-myanmar">
    {sections.map((section, index) => {
      const chorus = section.type === "chorus" || section.type === "refrain";
      return <section key={`${section.type}-${section.number}-${index}`} className={`mb-7 last:mb-0 ${chorus ? "border-l-2 border-[color-mix(in_srgb,var(--gold)_72%,transparent)] pl-4" : ""}`}>
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">{section.type === "verse" ? `Verse ${section.number ?? ""}` : section.type}</p>
        <div className="myanmar">{section.lines.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}</div>
      </section>;
    })}
  </div>;
}
