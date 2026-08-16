"use client";
import { useEffect } from "react";
export function ServiceWorker(){useEffect(()=>{
  if(!("serviceWorker" in navigator))return;
  if(process.env.NODE_ENV==="development"){
    navigator.serviceWorker.getRegistrations().then(registrations=>Promise.all(registrations.map(registration=>registration.unregister())));
    if("caches" in window)caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("hymn-house-")).map(key=>caches.delete(key))));
    return;
  }
  const hadController=Boolean(navigator.serviceWorker.controller);
  let refreshing=false;
  const handleControllerChange=()=>{if(hadController&&!refreshing){refreshing=true;location.reload()}};
  navigator.serviceWorker.addEventListener("controllerchange",handleControllerChange);
  const register=async()=>{
    let version="local";
    try{const response=await fetch("/app-version",{cache:"no-store"});if(response.ok)version=(await response.json() as {version?:string}).version||version}catch{}
    const registration=await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(version)}`,{updateViaCache:"none"});
    await registration.update();
    registration.active?.postMessage({type:"PRECACHE_APP_SHELL"});
  };
  void register();
  return()=>navigator.serviceWorker.removeEventListener("controllerchange",handleControllerChange);
},[]);return null}
