import { NewTranslationBrowser } from "@/components/new-translation-browser";
import { getSummaries } from "@/lib/hymns/data";
import { getNewMyanmarTranslationSummaries } from "@/lib/hymns/new-translations";

export const metadata={title:"New Translations | Hymn House"};

export default function NewTranslationsPage(){
  const ypItems=getSummaries("yp","my").filter(item=>typeof item.number==="number"&&item.number>=165&&item.number<=200);
  return <NewTranslationBrowser items={getNewMyanmarTranslationSummaries()} ypItems={ypItems} />;
}
