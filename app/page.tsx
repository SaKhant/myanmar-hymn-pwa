import { HymnBrowser } from "@/components/hymn-browser";
import { getHymns, toSummary } from "@/lib/hymns/data";
import { getNewMyanmarTranslationSummaries } from "@/lib/hymns/new-translations";

const INITIAL_HYMN_COUNT=50;

export default async function HymnsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params=await searchParams;
  const allMyanmar=getHymns("hymns","my");
  const myanmar=allMyanmar.slice(0,INITIAL_HYMN_COUNT).map(hymn=>({...toSummary(hymn,"hymns"),searchText:"",lyricSearchText:""}));
  const newTranslations=getNewMyanmarTranslationSummaries();
  return <HymnBrowser kind="hymns" myanmar={myanmar} totalCount={allMyanmar.length} allHymnsUrl="/hymn-summaries" newTranslations={newTranslations} initialQuery={params.q||""} lyricSearchUrl="/hymn-search-index"/>;
}
