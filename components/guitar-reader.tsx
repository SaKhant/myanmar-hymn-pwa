"use client";

import { useState } from "react";
import type { GuitarReaderProps } from "@/lib/hymns/guitar-types";

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
          {verse.lines.map((line, lineIndex) => <p className="guitar-line" key={lineIndex}>
            {line.segments.map((segment, segmentIndex) => <span className="guitar-segment" key={segmentIndex}>
              {segment.chord && <span className="guitar-chord" aria-label={`Chord ${segment.chord}`}>{segment.chord}</span>}
              {segment.text}
            </span>)}
          </p>)}
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
