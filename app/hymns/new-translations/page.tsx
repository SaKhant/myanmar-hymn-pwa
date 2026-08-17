import { NewTranslationBrowser } from "@/components/new-translation-browser";
import { getNewMyanmarTranslationSummaries } from "@/lib/hymns/new-translations";

export const metadata={title:"New Translations | Hymn House"};

export default function NewTranslationsPage(){
  return <NewTranslationBrowser items={getNewMyanmarTranslationSummaries()} />;
}
