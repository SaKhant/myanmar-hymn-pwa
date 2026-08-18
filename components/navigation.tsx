"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Music, Settings } from "lucide-react";
import { Brand } from "./brand";

const items = [
  { id:"hymns", href:"/", label:"Hymns", icon:BookOpen },
  { id:"yp", href:"/yp", label:"YP Songs", icon:Music }, { id:"favorites", href:"/favorites", label:"Favorites", icon:Heart },
  { id:"settings", href:"/settings", label:"Settings", icon:Settings },
];

function FilledSettings({size=21}:{size?:number}) {
  const gear="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z";
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={`${gear} M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0z`} fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>;
}

function FilledHeart({size=21}:{size?:number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" stroke="var(--muted)" strokeWidth="1.8"/></svg>;
}

function FilledBookOpen({size=21}:{size?:number}) {
  const pages="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z";
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={pages} fill="currentColor"/><path d={pages} fill="none" stroke="var(--muted)" strokeWidth="1.8"/><path d="M12 7v14" stroke="var(--muted)" strokeWidth="1.8"/></svg>;
}

function FilledMusic({size=21}:{size?:number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" stroke="var(--muted)" strokeWidth="1.8"/><circle cx="6" cy="18" r="3" fill="currentColor" stroke="var(--muted)" strokeWidth="1.8"/><circle cx="18" cy="16" r="3" fill="currentColor" stroke="var(--muted)" strokeWidth="1.8"/></svg>;
}
export function Navigation() {
  const path = usePathname();
  const matchesRoute=(route:string)=>path===route||path.startsWith(`${route}/`);
  const isActive=(href:string)=>href==="/"?(path==="/"||matchesRoute("/hymns")||matchesRoute("/categories")):matchesRoute(href);
  return <>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[var(--line)] bg-[var(--paper)] px-5 py-7 md:flex md:flex-col">
      <Brand /><nav className="mt-12 space-y-2" aria-label="Main navigation">{items.map(({href,label,icon:Icon}) => { const active=isActive(href); return <Link key={href} href={href} className={`focus-ring flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${active?"bg-[var(--sage-soft)] text-[var(--sage)]":"text-[var(--muted)] hover:bg-[var(--sage-soft)]"}`}><Icon size={19}/>{label}</Link>; })}</nav>
      <p className="mt-auto px-4 text-xs leading-5 text-[var(--muted)]">Read slowly. Sing wholeheartedly.</p>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_94%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Main navigation">{items.map(({id,href,label,icon:Icon}) => { const active=isActive(href); return <Link key={href} href={href} data-tab={id} aria-current={active?"page":undefined} className="bottom-nav-link focus-ring flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold">{active&&id==="hymns"?<FilledBookOpen/>:active&&id==="yp"?<FilledMusic/>:active&&id==="favorites"?<FilledHeart/>:active&&id==="settings"?<FilledSettings/>:<Icon color="currentColor" fill="none" size={21} strokeWidth={1.8}/>}<span>{label}</span></Link>; })}</nav>
  </>;
}
