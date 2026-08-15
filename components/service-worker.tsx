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
  navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(registration=>registration.update());
  return()=>navigator.serviceWorker.removeEventListener("controllerchange",handleControllerChange);
},[]);return null}
