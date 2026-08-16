import { HymnBrowser } from "@/components/hymn-browser";
import { getSummaries } from "@/lib/hymns/data";

export default async function HymnsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params=await searchParams;
  const myanmar=getSummaries("hymns","my").map(hymn=>({...hymn,searchText:"",lyricSearchText:""}));
  return <HymnBrowser kind="hymns" myanmar={myanmar} initialQuery={params.q||""} lyricSearchUrl="/hymn-search-index"/>;
}
