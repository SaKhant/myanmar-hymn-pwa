"use client";

import { useEffect } from "react";

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
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      location.href=`${url.pathname}${url.search}${url.hash}`;
    };
    document.addEventListener("click",handleClick,true);
    return()=>document.removeEventListener("click",handleClick,true);
  },[]);
  return null;
}
