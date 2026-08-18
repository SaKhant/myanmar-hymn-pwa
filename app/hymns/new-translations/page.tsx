import { NewTranslationBrowser } from "@/components/new-translation-browser";
import { getSummaries } from "@/lib/hymns/data";
import { getNewMyanmarTranslationSummaries } from "@/lib/hymns/new-translations";

export const metadata={title:"New Translations | Hymn House"};

type TranslationSection="hymns"|"yp"|null;

export default async function NewTranslationsPage({searchParams}:{searchParams:Promise<{section?:string}>}){
  const params=await searchParams;
  const initialSection:TranslationSection=params.section==="hymns"?"hymns":params.section==="yp"?"yp":null;
  const ypItems=getSummaries("yp","my").filter(item=>typeof item.number==="number"&&item.number>=165&&item.number<=200);
  return <NewTranslationBrowser items={getNewMyanmarTranslationSummaries()} ypItems={ypItems} initialSection={initialSection} hideCollectionOptions={initialSection!==null} />;
}
