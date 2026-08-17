import { HymnBrowser } from "@/components/hymn-browser";
import { getSummaries } from "@/lib/hymns/data";
import { getNewMyanmarTranslationSummaries } from "@/lib/hymns/new-translations";

export default async function HymnsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params=await searchParams;
  const myanmar=getSummaries("hymns","my").map(hymn=>({...hymn,searchText:"",lyricSearchText:""}));
  const newTranslations=getNewMyanmarTranslationSummaries();
  return <HymnBrowser kind="hymns" myanmar={myanmar} newTranslations={newTranslations} initialQuery={params.q||""} lyricSearchUrl="/hymn-search-index"/>;
}
