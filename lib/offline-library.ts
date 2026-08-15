import type { HymnCategory, HymnCollection, HymnRecord } from "@/lib/hymns/types";

export const OFFLINE_DATABASE_NAME="hymn-house-offline";
export const OFFLINE_HYMN_STORE="hymns";
export const OFFLINE_CATEGORY_STORE="categories";
export const OFFLINE_METADATA_STORE="metadata";
const DATABASE_VERSION=1;

export type OfflineHymn=Omit<HymnRecord,"audio_url"> & {key:string};
export type OfflineLibraryMeta={key:"library";version:string;releaseDate:string;downloadedAt:string;sizeBytes:number;hymnCount:number;categoryCount:number};
type OfflinePayload={version:string;releaseDate:string;collections:Record<HymnCollection,Array<Omit<HymnRecord,"audio_url">>>;categories:HymnCategory[]};

function requestResult<T>(request:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function transactionDone(transaction:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??new Error("Offline library update was aborted"))})}

export function openOfflineDatabase():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(OFFLINE_DATABASE_NAME,DATABASE_VERSION);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains(OFFLINE_HYMN_STORE))database.createObjectStore(OFFLINE_HYMN_STORE,{keyPath:"key"});
      if(!database.objectStoreNames.contains(OFFLINE_CATEGORY_STORE))database.createObjectStore(OFFLINE_CATEGORY_STORE,{keyPath:"slug"});
      if(!database.objectStoreNames.contains(OFFLINE_METADATA_STORE))database.createObjectStore(OFFLINE_METADATA_STORE,{keyPath:"key"});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

export async function readOfflineLibraryMeta():Promise<OfflineLibraryMeta|null>{
  if(typeof indexedDB==="undefined")return null;
  const database=await openOfflineDatabase();
  try{return (await requestResult(database.transaction(OFFLINE_METADATA_STORE).objectStore(OFFLINE_METADATA_STORE).get("library")) as OfflineLibraryMeta|undefined)??null}
  finally{database.close()}
}

function validatePayload(value:unknown):OfflinePayload{
  if(!value||typeof value!=="object")throw new Error("Invalid offline library response");
  const payload=value as Partial<OfflinePayload>;
  const collections=payload.collections;
  if(typeof payload.version!=="string"||typeof payload.releaseDate!=="string"||!collections||!Array.isArray(payload.categories))throw new Error("Invalid offline library response");
  for(const key of ["myanmar_hymns","english_hymns","myanmar_yp","english_yp"] as HymnCollection[]){
    if(!Array.isArray(collections[key]))throw new Error(`Missing offline collection: ${key}`);
  }
  return payload as OfflinePayload;
}

async function fetchLibrary(onProgress?:(received:number,total:number)=>void):Promise<{payload:OfflinePayload;sizeBytes:number}>{
  const response=await fetch("/offline-library",{cache:"no-store"});
  if(!response.ok)throw new Error("Could not download the offline library");
  const total=Number(response.headers.get("Content-Length"))||0;
  if(!response.body){const text=await response.text();return {payload:validatePayload(JSON.parse(text)),sizeBytes:new Blob([text]).size}}
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let text="",received=0;
  while(true){const {done,value}=await reader.read();if(done)break;received+=value.byteLength;text+=decoder.decode(value,{stream:true});onProgress?.(received,total)}
  text+=decoder.decode();
  return {payload:validatePayload(JSON.parse(text)),sizeBytes:received};
}

export async function downloadOfflineLibrary(onProgress?:(received:number,total:number)=>void):Promise<OfflineLibraryMeta>{
  const {payload,sizeBytes}=await fetchLibrary(onProgress);
  const hymns=Object.values(payload.collections).flatMap(collection=>collection.map(hymn=>({...hymn,key:`${hymn.collection}:${hymn.id}`})));
  const database=await openOfflineDatabase();
  const metadata:OfflineLibraryMeta={key:"library",version:payload.version,releaseDate:payload.releaseDate,downloadedAt:new Date().toISOString(),sizeBytes,hymnCount:hymns.length,categoryCount:payload.categories.length};
  try{
    const transaction=database.transaction([OFFLINE_HYMN_STORE,OFFLINE_CATEGORY_STORE,OFFLINE_METADATA_STORE],"readwrite");
    const hymnStore=transaction.objectStore(OFFLINE_HYMN_STORE),categoryStore=transaction.objectStore(OFFLINE_CATEGORY_STORE),metadataStore=transaction.objectStore(OFFLINE_METADATA_STORE);
    hymnStore.clear();categoryStore.clear();metadataStore.clear();
    hymns.forEach(hymn=>hymnStore.put(hymn));
    payload.categories.forEach(category=>categoryStore.put(category));
    metadataStore.put(metadata);
    await transactionDone(transaction);
  } finally {database.close()}
  try{await navigator.storage?.persist?.()}catch{}
  window.dispatchEvent(new CustomEvent("offline-library-updated",{detail:metadata}));
  return metadata;
}

export async function getAvailableOfflineLibraryVersion():Promise<{version:string;releaseDate:string}>{
  const response=await fetch("/offline-library/version",{cache:"no-store"});
  if(!response.ok)throw new Error("Could not check for library updates");
  return response.json() as Promise<{version:string;releaseDate:string}>;
}

