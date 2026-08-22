import { CategoriesBrowser } from "@/components/categories-browser";
import { ReaderBackButton } from "@/components/reader-back-button";
import { getCategories, getSummaries } from "@/lib/hymns/data";

export default function CategoriesPage(){
  return <main className="page">
    <ReaderBackButton fallback="/" label="Back to Hymns"/>
    <p className="eyebrow">Myanmar hymn book</p>
    <h1 className="myanmar mt-2 font-serif text-4xl md:text-5xl">မာတိကာ ဇယား</h1>
    <p className="mt-3 text-[var(--muted)]">Select a category to see its hymn list.</p>
    <CategoriesBrowser categories={getCategories()} hymns={getSummaries("hymns","my")}/>
  </main>;
}
