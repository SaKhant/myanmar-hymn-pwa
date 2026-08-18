"use client";

import { useState } from "react";
import Image from "next/image";
import type { GuitarLine, GuitarReaderProps, GuitarSegment } from "@/lib/hymns/guitar-types";

type ReaderMode = "lyrics" | "guitar" | "numbered-notes";
type GuitarReaderWithNumberedNotesProps = GuitarReaderProps & { numberedNotesImageSrc?: string };

function lineSegments(line:GuitarLine):GuitarSegment[] {
  if(line.phrases)return line.phrases.flatMap(phrase=>phrase.segments);
  return line.segments??[];
}

export function GuitarReader({ sections, arrangement, numberedNotesImageSrc }: GuitarReaderWithNumberedNotesProps) {
  const [mode, setMode] = useState<ReaderMode>("lyrics");

  return <>
    <div className="reader-mode-switch" role="group" aria-label="Reader display mode">
      <button type="button" aria-pressed={mode === "lyrics"} onClick={() => setMode("lyrics")}>Lyrics</button>
      <button type="button" aria-pressed={mode === "guitar"} onClick={() => setMode("guitar")}>Guitar</button>
      {numberedNotesImageSrc&&<button type="button" aria-pressed={mode === "numbered-notes"} onClick={() => setMode("numbered-notes")}>Numbered Notes</button>}
    </div>

    {mode === "lyrics" ? <LyricsView sections={sections}/> : mode === "numbered-notes"&&numberedNotesImageSrc ? <NumberedNotesView imageSrc={numberedNotesImageSrc}/> : <div className="guitar-view">
      <div className="guitar-info" aria-label={`Original key ${arrangement.originalKey}, capo ${arrangement.capo}, play in ${arrangement.playKey}`}>
        <span>Key <strong>{arrangement.originalKeyDisplay}</strong></span><i aria-hidden="true">•</i>
        <span>Capo <strong>{arrangement.capo}</strong></span><i aria-hidden="true">•</i>
        <span>Play <strong>{arrangement.playKey}</strong></span>
      </div>
      {arrangement.verses.map((verse,sectionIndex) => {
        const chorus=verse.type==="chorus"||verse.type==="refrain";
        return <section key={`${verse.type??"verse"}-${verse.number}-${sectionIndex}`} className="guitar-verse" style={{paddingLeft:0}}>
          {!chorus&&<div className="mb-[.65rem] flex min-h-7 items-center">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e2e2] text-[.8rem] font-normal leading-none text-[#4b5563]"
              style={{fontFamily:"Arial, sans-serif"}}
              aria-label={`Verse ${verse.number}`}
            >{verse.number}</span>
          </div>}
          <div className="myanmar">
            {verse.lines.map((line, lineIndex) => <div className="guitar-line" key={lineIndex}>
              <div className="guitar-phrase guitar-sentence-line">
                {lineSegments(line).map((segment, segmentIndex) => <span className="guitar-segment" key={segmentIndex}>
                  <span className="guitar-chord" aria-label={segment.chord?`Chord ${segment.chord}`:undefined}>{segment.chord??"\u00a0"}</span>
                  <span className="guitar-lyric-segment">{segment.text}</span>
                </span>)}
              </div>
            </div>)}
          </div>
        </section>;
      })}
    </div>}
  </>;
}

function NumberedNotesView({ imageSrc }: { imageSrc: string }) {
  const [zoom, setZoom] = useState(1);
  const changeZoom = (amount: number) => setZoom((current) => Math.min(2.5, Math.max(1, Number((current + amount).toFixed(2)))));

  return <section className="numbered-notes-view" aria-label="Numbered musical notation">
    <div className="numbered-notes-toolbar">
      <p>Numbered Notes</p>
      <div role="group" aria-label="Numbered notes zoom">
        <button type="button" onClick={() => changeZoom(-0.25)} disabled={zoom === 1} aria-label="Zoom out">−</button>
        <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
        <button type="button" onClick={() => changeZoom(0.25)} disabled={zoom === 2.5} aria-label="Zoom in">+</button>
      </div>
    </div>
    <div className="numbered-notes-viewport">
      <div className="numbered-notes-canvas" style={{ width: `${zoom * 100}%` }}>
        <Image src={imageSrc} alt="Myanmar Hymn 1 numbered musical notation" width={1800} height={1380} sizes="(max-width: 42rem) 100vw, 42rem" draggable={false}/>
      </div>
    </div>
    <p className="numbered-notes-hint">Pinch or use the controls to zoom.</p>
  </section>;
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
