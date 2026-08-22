import type { HymnCategory, HymnCollection, HymnRecord } from "@/lib/hymns/types";

export const OFFLINE_DATABASE_NAME="hymn-house-offline";
export const OFFLINE_HYMN_STORE="hymns";
export const OFFLINE_CATEGORY_STORE="categories";
export const OFFLINE_METADATA_STORE="metadata";
// Never lower this value: some installed PWAs already upgraded to schema 2.
const DATABASE_VERSION=2;

export type OfflineHymn=Omit<HymnRecord,"audio_url"> & {key:string};
export type OfflineLibraryMeta={key:"library";version:string;releaseDate:string;downloadedAt:string;sizeBytes:number;hymnCount:number;categoryCount:number};
export type OfflineNewTranslation={
  id:string;
  english_number:number;
  myanmar_number:null;
  status:"unassigned";
  category:string;
  english_title:string|null;
  meter:string|null;
  title:string;
  verse_numbers:number[];
  source_note:string|null;
  raw_lines:string[];
  header_lines:string[];
  source_number_line:string;
};
export type OfflineNewYpTranslation={
  id:string;
  title:string;
  source_ref:string|null;
  source_kind:"NS"|"H"|"LB"|null;
  source_number:number|null;
  raw_lines:string[];
};
type OfflinePayload={
  version:string;
  releaseDate:string;
  collections:Record<HymnCollection,Array<Omit<HymnRecord,"audio_url">>>;
  categories:HymnCategory[];
  newTranslations:OfflineNewTranslation[];
  newYpTranslations:OfflineNewYpTranslation[];
};
type StoredItems<T>={key:string;items:T[]};

function requestResult<T>(request:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function transactionDone(transaction:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??new Error("Offline library update was aborted"))})}

export function openOfflineDatabase():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(OFFLINE_DATABASE_NAME,DATABASE_VERSION);
    request.onupgradeneeded=()=>{
      const database=request.result;
      const hymnStore=database.objectStoreNames.contains(OFFLINE_HYMN_STORE)?request.transaction!.objectStore(OFFLINE_HYMN_STORE):database.createObjectStore(OFFLINE_HYMN_STORE,{keyPath:"key"});
      if(!hymnStore.indexNames.contains("collection"))hymnStore.createIndex("collection","collection");
      if(!hymnStore.indexNames.contains("collection-number"))hymnStore.createIndex("collection-number",["collection","number"]);
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

export async function readOfflineHymns():Promise<OfflineHymn[]>{
  if(typeof indexedDB==="undefined")return [];
  const database=await openOfflineDatabase();
  try{
    const hymns=await requestResult(database.transaction(OFFLINE_HYMN_STORE).objectStore(OFFLINE_HYMN_STORE).getAll()) as OfflineHymn[];
    return hymns.sort((a,b)=>{
      const collectionOrder=a.collection.localeCompare(b.collection);
      if(collectionOrder!==0)return collectionOrder;
      const aNumber=a.number??Number.POSITIVE_INFINITY;
      const bNumber=b.number??Number.POSITIVE_INFINITY;
      return aNumber-bNumber||a.id.localeCompare(b.id,undefined,{numeric:true});
    });
  }
  finally{database.close()}
}

export async function readOfflineCategories():Promise<HymnCategory[]>{
  if(typeof indexedDB==="undefined")return [];
  const database=await openOfflineDatabase();
  try{return await requestResult(database.transaction(OFFLINE_CATEGORY_STORE).objectStore(OFFLINE_CATEGORY_STORE).getAll()) as HymnCategory[]}
  finally{database.close()}
}

async function readStoredItems<T>(key:string):Promise<T[]>{
  if(typeof indexedDB==="undefined")return [];
  const database=await openOfflineDatabase();
  try{
    const stored=await requestResult(database.transaction(OFFLINE_METADATA_STORE).objectStore(OFFLINE_METADATA_STORE).get(key)) as StoredItems<T>|undefined;
    return Array.isArray(stored?.items)?stored.items:[];
  } finally {database.close()}
}

export function readOfflineNewTranslations():Promise<OfflineNewTranslation[]>{
  return readStoredItems<OfflineNewTranslation>("new-translations");
}

export function readOfflineNewYpTranslations():Promise<OfflineNewYpTranslation[]>{
  return readStoredItems<OfflineNewYpTranslation>("new-yp-translations");
}

function validatePayload(value:unknown):OfflinePayload{
  if(!value||typeof value!=="object")throw new Error("Invalid offline library response");
  const payload=value as Partial<OfflinePayload>;
  const collections=payload.collections;
  if(typeof payload.version!=="string"||typeof payload.releaseDate!=="string"||!collections||!Array.isArray(payload.categories)||!Array.isArray(payload.newTranslations)||!Array.isArray(payload.newYpTranslations))throw new Error("Invalid offline library response");
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
    metadataStore.put({key:"new-translations",items:payload.newTranslations} satisfies StoredItems<OfflineNewTranslation>);
    metadataStore.put({key:"new-yp-translations",items:payload.newYpTranslations} satisfies StoredItems<OfflineNewYpTranslation>);
    await transactionDone(transaction);
  } finally {database.close()}
  writeOfflineLibrarySnapshot(payload.version,payload.collections);
  try{await navigator.storage?.persist?.()}catch{}
  window.dispatchEvent(new CustomEvent("offline-library-updated",{detail:metadata}));
  return metadata;
}

export async function getAvailableOfflineLibraryVersion():Promise<{version:string;releaseDate:string}>{
  const response=await fetch("/offline-library/version",{cache:"no-store"});
  if(!response.ok)throw new Error("Could not check for library updates");
  return response.json() as Promise<{version:string;releaseDate:string}>;
}

export type OfflineSnapshotSummary={id:string;number:number|null;title:string;firstLine:string;theme:string};
export type OfflineLibrarySnapshot={version:string;savedAt:string;myanmarHymns:OfflineSnapshotSummary[];myanmarYp:OfflineSnapshotSummary[]};
const SNAPSHOT_STORAGE_KEY="hymn-house:library-snapshot";

function toSnapshotSummary(hymn:{id:string;number:number|null;title:string|null;first_line:string|null;theme:string|null}):OfflineSnapshotSummary{
  return {id:hymn.id,number:hymn.number??null,title:hymn.title?.trim()||hymn.first_line?.trim()||`Hymn ${hymn.number??hymn.id}`,firstLine:hymn.first_line?.trim()??"",theme:hymn.theme?.trim()??""};
}

export function writeOfflineLibrarySnapshot(version:string,collections:OfflinePayload["collections"]):void{
  try{
    const snapshot:OfflineLibrarySnapshot={version,savedAt:new Date().toISOString(),myanmarHymns:(collections.myanmar_hymns??[]).map(toSnapshotSummary),myanmarYp:(collections.myanmar_yp??[]).map(toSnapshotSummary)};
    localStorage.setItem(SNAPSHOT_STORAGE_KEY,JSON.stringify(snapshot));
  }catch{}
}

export function readOfflineLibrarySnapshot():OfflineLibrarySnapshot|null{
  try{
    const raw=localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as OfflineLibrarySnapshot;
    return typeof parsed?.version==="string"&&Array.isArray(parsed.myanmarHymns)&&Array.isArray(parsed.myanmarYp)?parsed:null;
  }catch{return null}
}

export function clearOfflineLibrarySnapshot():void{try{localStorage.removeItem(SNAPSHOT_STORAGE_KEY)}catch{}}
