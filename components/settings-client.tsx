"use client";
import { useEffect, useState } from "react";
import { FONT_SIZE_KEY, readStored, writeStored } from "@/lib/storage";
import { useTheme } from "@/components/theme-provider";

export function SettingsClient() {
  const [size, setSize] = useState(20);
  const {theme,setTheme}=useTheme();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSize(readStored(FONT_SIZE_KEY, 20));
  }, []);
  const update = (next: number) => { setSize(next); writeStored(FONT_SIZE_KEY, next); };
  return <div className="surface mt-8 p-6">
    <fieldset>
      <legend className="font-bold">Appearance</legend>
      <p className="mt-1 text-sm text-[var(--muted)]">Choose the app color mode.</p>
      <div className="mt-4 inline-flex rounded-xl border border-[var(--line)] p-1" aria-label="Color mode">
        {(["light", "dark"] as const).map((option) => <button key={option} type="button" aria-pressed={theme===option} onClick={() => setTheme(option)} className={`focus-ring rounded-lg px-4 py-2 text-sm font-bold capitalize ${theme===option?`theme-option-${option}`:"text-[var(--muted)]"}`}>{option}</button>)}
      </div>
    </fieldset>
    <div className="mt-7 border-t border-[var(--line)] pt-6">
    <label htmlFor="font" className="font-bold">Default lyric size</label>
    <p className="mt-1 text-sm text-[var(--muted)]">Adjust from the reader at any time.</p>
    <div className="mt-5 flex items-center gap-4"><input id="font" type="range" min="16" max="32" step="2" value={size} onChange={(event) => update(Number(event.target.value))} className={theme==="dark"?"accent-[#a96bd8]":"accent-[var(--active-blue)]"}/><span className="w-12 text-sm font-bold">{size}px</span></div>
    <p className="myanmar mt-7" style={{fontSize:size}}>အံ့ဘွယ် ကျေးဇူးတော်</p><p className="mt-1" style={{fontSize:size}}>Amazing grace</p>
    </div>
  </div>;
}
