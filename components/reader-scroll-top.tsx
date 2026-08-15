"use client";

import { useLayoutEffect } from "react";

export function ReaderScrollTop({routeKey}:{routeKey:string}){
  useLayoutEffect(()=>{
    window.scrollTo(0,0);
    const frame=window.requestAnimationFrame(()=>window.scrollTo(0,0));
    return()=>window.cancelAnimationFrame(frame);
  },[routeKey]);
  return null;
}
