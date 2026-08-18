import { NewTranslationBrowser } from "@/components/new-translation-browser";
import { getNewMyanmarTranslationSummaries } from "@/lib/hymns/new-translations";
import { getNewYpTranslationSummaries } from "@/lib/hymns/new-yp-translations";

export const metadata={title:"New Translations | Hymn House"};

type TranslationSection="hymns"|"yp";

export default async function NewTranslationsPage({searchParams}:{searchParams:Promise<{section?:string}>}){
  const params=await searchParams;
  const initialSection:TranslationSection=params.section==="yp"?"yp":"hymns";
  return <NewTranslationBrowser items={getNewMyanmarTranslationSummaries()} ypItems={getNewYpTranslationSummaries()} initialSection={initialSection} hideCollectionOptions />;
}
