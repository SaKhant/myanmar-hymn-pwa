const version=new URL(self.location.href).searchParams.get("v")||"legacy";
const cacheName=`hymn-house-shell-${version}`;
const cachePrefix="hymn-house-shell-";
const appShell=["/","/icon-192.png","/icon-512.png"];

async function cacheResponse(request,response){
  if(!response||!response.ok)return response;
  const cache=await caches.open(cacheName);
  await cache.put(request,response.clone());
  if(response.headers.get("content-type")?.includes("text/html")){
    const html=await response.clone().text();
    const assets=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match=>match[1]).filter(value=>value.startsWith("/_next/")||value.startsWith("/icon-"));
    await Promise.all([...new Set(assets)].map(async asset=>{try{const assetResponse=await fetch(asset,{cache:"reload"});if(assetResponse.ok)await cache.put(asset,assetResponse)}catch{}}));
  }
  return response;
}
async function precache(urls){
  await Promise.all(urls.map(async url=>{try{await cacheResponse(url,await fetch(url,{cache:"reload"}))}catch{}}));
}

self.addEventListener("install",event=>event.waitUntil(precache(appShell).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("hymn-house-")&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{if(event.data?.type==="PRECACHE_APP_SHELL")event.waitUntil(precache(appShell))});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith("/offline-library")||url.pathname==="/app-version"||event.request.destination==="audio")return;
  if(url.pathname.startsWith("/jianpu/")||url.pathname.startsWith("/api/piano-score/")){
    event.respondWith(fetch(event.request,{cache:"no-store"}));
    return;
  }
  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{try{return await cacheResponse(event.request,await fetch(event.request))}catch{return (await caches.match(event.request))||(await caches.match(url.pathname))||(await caches.match("/"))||Response.error()}})());
    return;
  }
  event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached){event.waitUntil(fetch(event.request).then(response=>cacheResponse(event.request,response)).catch(()=>undefined));return cached}try{return await cacheResponse(event.request,await fetch(event.request))}catch{return Response.error()}})());
});
