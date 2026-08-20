"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Brand } from "./brand";
import { OFFLINE_NAVIGATION_EVENT } from "./offline-navigation";

function OpenBookIcon({size=21}:{size?:number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7 127L0 138L3 443L18 451L78 440L146 437L214 446L167 416L125 404L66 399L37 377L31 361L31 124Z"/><path d="M72 61L60 75L61 360L76 371L117 373L171 386L208 404L241 431L240 138L210 102L169 77L118 63Z"/><path d="M439 61L393 63L342 77L301 102L271 138L270 431L303 404L340 386L394 373L435 371L450 360L451 75Z"/><path d="M504 127L480 124L480 361L474 377L445 399L386 404L344 416L297 446L365 437L433 440L493 451L508 443L511 138Z"/></svg>;
}

function SongLyricsIcon({size=21}:{size?:number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="81" width="235" height="56" rx="28"/>
    <rect x="0" y="179" width="235" height="56" rx="28"/>
    <rect x="0" y="277" width="152" height="56" rx="28"/>
    <rect x="0" y="375" width="126" height="56" rx="28"/>
    <path d="M323 0L310 1L300 6L291 19L289 29V334L286 335L269 330L253 329L229 333L212 340L196 351L182 366L171 386L165 408L166 438L172 457L181 473L198 491L206 497L222 505L239 510H272L289 505L303 498L313 491L326 478L335 465L343 446L346 431L347 116L374 144L442 201L451 216L454 227V243L451 254L443 268L432 279L412 288L390 291L384 294L376 302L372 312V323L380 338L393 345L410 346L431 342L458 330L474 318L491 299L504 275L510 253L511 228L509 212L503 192L489 168L476 154L437 124L400 89L371 55L343 13L332 3Z"/>
  </svg>;
}

function LikeIcon({size=21}:{size?:number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512" fill="currentColor" fillRule="evenodd" xmlns="http://www.w3.org/2000/svg">
    <path d="M92 44L61 62L38 83L20 108L8 134L1 164L0 195L4 221L13 247L28 273L44 292L220 467L228 472L247 478L264 478L283 472L297 462L468 291L489 264L498 247L506 225L511 196L510 163L505 140L500 126L491 108L478 89L454 65L443 57L421 45L390 35L366 32L352 32L333 34L316 38L299 44L283 52L256 72L233 55L212 44L192 37L178 34L160 32L133 33L109 38ZM105 81L121 75L144 71L160 71L183 75L197 80L212 88L229 101L245 117L257 120L266 117L293 92L312 81L325 76L343 72L375 72L393 76L408 82L430 96L447 113L455 124L463 139L471 166L472 195L466 222L460 236L452 249L445 258L267 436L263 438L251 439L244 436L66 258L50 234L43 216L39 195L40 166L46 144L53 129L64 113L81 96Z"/>
  </svg>;
}

const items = [
  { id:"hymns", href:"/", label:"Hymns", icon:OpenBookIcon },
  { id:"yp", href:"/yp", label:"YP Songs", icon:SongLyricsIcon },
  { id:"favorites", href:"/favorites", label:"Favorites", icon:LikeIcon },
  { id:"settings", href:"/settings", label:"Settings", icon:Settings },
];

function FilledSettings({size=21}:{size?:number}) {
  const gear="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z";
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={`${gear} M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0z`} fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>;
}

export function Navigation() {
  const pathname = usePathname();
  const [route,setRoute]=useState({pathname,search:""});

  useEffect(()=>{
    const sync=()=>setRoute({pathname:window.location.pathname,search:window.location.search});
    sync();
    window.addEventListener("popstate",sync);
    window.addEventListener(OFFLINE_NAVIGATION_EVENT,sync);
    return()=>{
      window.removeEventListener("popstate",sync);
      window.removeEventListener(OFFLINE_NAVIGATION_EVENT,sync);
    };
  },[pathname]);

  const path=route.pathname||pathname;
  const isYpNewTranslations=path==="/hymns/new-translations"&&new URLSearchParams(route.search).get("section")==="yp";
  const matchesRoute=(routePath:string)=>path===routePath||path.startsWith(`${routePath}/`);
  const isActive=(href:string)=>{
    if(href==="/")return !isYpNewTranslations&&(path==="/"||matchesRoute("/hymns")||matchesRoute("/categories"));
    if(href==="/yp")return isYpNewTranslations||matchesRoute("/yp");
    return matchesRoute(href);
  };

  return <>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[var(--line)] bg-[var(--paper)] px-5 py-7 md:flex md:flex-col">
      <Brand /><nav className="mt-12 space-y-2" aria-label="Main navigation">{items.map(({href,label,icon:Icon}) => { const active=isActive(href); return <Link key={href} href={href} className={`focus-ring flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${active?"bg-[var(--sage-soft)] text-[var(--sage)]":"text-[var(--muted)] hover:bg-[var(--sage-soft)]"}`}><Icon size={19}/>{label}</Link>; })}</nav>
      <p className="mt-auto px-4 text-xs leading-5 text-[var(--muted)]">Read slowly. Sing wholeheartedly.</p>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_94%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Main navigation">{items.map(({id,href,label,icon:Icon}) => { const active=isActive(href); return <Link key={href} href={href} data-tab={id} aria-current={active?"page":undefined} className="bottom-nav-link focus-ring flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold">{active&&id==="hymns"?<OpenBookIcon/>:active&&id==="yp"?<SongLyricsIcon/>:active&&id==="favorites"?<LikeIcon/>:active&&id==="settings"?<FilledSettings/>:<Icon size={21}/>}<span>{label}</span></Link>; })}</nav>
  </>;
}
