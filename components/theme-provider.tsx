"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { readStored, THEME_KEY, writeStored } from "@/lib/storage";

export type Theme = "light" | "dark";

type ThemeContextValue = { theme:Theme|null; setTheme:(theme:Theme)=>void };
const ThemeContext=createContext<ThemeContextValue|null>(null);

function applyTheme(theme:Theme){
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  const color=theme==="dark"?"#151a17":"#fbfaf6";
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta=>{meta.content=color});
}

export function ThemeProvider({children}:{children:React.ReactNode}){
  const [theme,setThemeState]=useState<Theme|null>(null);
  useEffect(()=>{
    const initial=document.documentElement.dataset.theme;
    // The pre-hydration script has already applied the stored preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial==="dark"?"dark":"light");
    const sync=()=>{
      const preferred=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
      const stored=readStored<Theme>(THEME_KEY,preferred);
      const next=stored==="dark"?"dark":"light";
      applyTheme(next);
      setThemeState(next);
    };
    window.addEventListener("storage",sync);
    return()=>window.removeEventListener("storage",sync);
  },[]);
  const setTheme=useCallback((next:Theme)=>{applyTheme(next);setThemeState(next);writeStored(THEME_KEY,next)},[]);
  return <ThemeContext.Provider value={{theme,setTheme}}>{children}</ThemeContext.Provider>;
}

export function useTheme(){
  const value=useContext(ThemeContext);
  if(!value)throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
