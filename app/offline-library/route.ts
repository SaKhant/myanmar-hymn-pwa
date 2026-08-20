import { getCategories, getHymns } from "@/lib/hymns/data";
import { kachinHymns } from "@/lib/hymns/kachin-data";
import { matuHymns } from "@/lib/hymns/matu-data";
import { OFFLINE_LIBRARY_RELEASE_DATE, OFFLINE_LIBRARY_VERSION } from "@/lib/offline-library-version";

function withoutAudio<T extends {audio_url:string|null}>(record:T) {
  const {audio_url:_,...offlineRecord}=record;
  void _;
  return offlineRecord;
}

export function GET() {
  const payload={
    version:OFFLINE_LIBRARY_VERSION,
    releaseDate:OFFLINE_LIBRARY_RELEASE_DATE,
    collections:{
      myanmar_hymns:getHymns("hymns","my").map(withoutAudio),
      english_hymns:getHymns("hymns","en").map(withoutAudio),
      myanmar_yp:getHymns("yp","my").map(withoutAudio),
      english_yp:getHymns("yp","en").map(withoutAudio),
      kachin_hymns:kachinHymns.map(withoutAudio),
      matu_hymns:matuHymns.map(withoutAudio),
    },
    categories:getCategories(),
  };
  return Response.json(payload,{headers:{"Cache-Control":"no-store, max-age=0"}});
}
