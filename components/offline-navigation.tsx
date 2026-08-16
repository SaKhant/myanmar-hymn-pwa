"use client";

import { useEffect } from "react";

export const OFFLINE_NAVIGATION_EVENT="hymn-house:offline-navigation";
export const OFFLINE_SCROLL_STATE="__hymnHouseOfflineScroll";

export function navigateOffline(destination:string,replace=false){
  const container=document.querySelector<HTMLElement>(".offline-app");
  if(!replace)history.replaceState({...history.state,[OFFLINE_SCROLL_STATE]:container?.scrollTop??0},"");
  const nextState={...history.state,[OFFLINE_SCROLL_STATE]:0};
  if(replace)history.replaceState(nextState,"",destination);
  else history.pushState(nextState,"",destination);
  window.dispatchEvent(new Event(OFFLINE_NAVIGATION_EVENT));
}

export function OfflineNavigation(){
  useEffect(()=>{
    const handleClick=(event:MouseEvent)=>{
      if(navigator.onLine||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const target=event.target instanceof Element?event.target.closest("a[href]"):null;
      if(!(target instanceof HTMLAnchorElement)||target.target==="_blank"||target.download)return;
      const url=new URL(target.href,location.href);
      if(url.origin!==location.origin)return;
      event.preventDefault();
      // A hard navigation lets the service worker return the cached normal app shell.
      const destination=`${url.pathname}${url.search}${url.hash}`;
      const hymnReader=/^\/hymns\/(?:my|en)\/[^/]+/.test(location.pathname);
      const nextHymnReader=/^\/hymns\/(?:my|en)\/[^/]+/.test(url.pathname);
      navigateOffline(destination,hymnReader&&nextHymnReader);
    };
    document.addEventListener("click",handleClick,true);
    return()=>document.removeEventListener("click",handleClick,true);
  },[]);
  return null;
}
