import { getSummaries } from "@/lib/hymns/data";

export function GET(){
  const hymns=getSummaries("hymns","my").map(({searchText,lyricSearchText,...hymn})=>hymn);
  return Response.json(hymns,{headers:{"Cache-Control":"public, max-age=3600"}});
}
