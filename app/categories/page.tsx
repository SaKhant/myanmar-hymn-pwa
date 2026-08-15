import Link from "next/link";
import { getCategories } from "@/lib/hymns/data";

function categoryNumber(category:string):number {
  const match=category.match(/^\s*(\d+)/);
  return match?Number(match[1]):Number.POSITIVE_INFINITY;
}

const burmeseCategoryFallbacks:Record<string,string>={
  Divine_Healing:"အနာရောဂါငြိမ်းစေခြင်း", Prayer:"ဆုတောင်းခြင်း", Study_of_the_Word:"နှုတ်ကပတ်တော်လေ့လာခြင်း", The_Church:"အသင်းတော်", Meetings:"စုဝေးခြင်းများ", Spiritual_Warfare:"ဝိညာဉ်ရေးရာတိုက်ပွဲ", Service:"အမှုတော်ဆောင်ခြင်း", Preaching_of_the_Gospel:"ဧဝံဂေလိတရားဟောပြောခြင်း", Baptism:"ဗတ္တိဇံ", The_Lord_s_Day:"သခင်ဘုရား၏နေ့", The_Kingdom:"နိုင်ငံတော်", Hope_of_Glory:"ဘုန်းတော်မျှော်လင့်ခြင်း", Ultimate_Manifestation:"နောက်ဆုံးထင်ရှားပေါ်ထွန်းခြင်း", Gospel:"ဧဝံဂေလိတရား", The_Word_of_God:"ဘုရားသခင်၏နှုတ်ကပတ်တော်", Others:"အခြားများ", Preaching_the_Gospel:"ဧဝံဂေလိတရားဟောပြောခြင်း",
};

function categoryTitle(category:{slug:string;category:string}):string {
  if(/[\u1000-\u109f]/u.test(category.category))return category.category;
  return `${categoryNumber(category.category)}. ${burmeseCategoryFallbacks[category.slug]??category.category.replace(/^\s*\d+\.\s*/,"").replace(/\s*\[\d+\]\s*$/,"")}`;
}

export default function CategoriesPage(){const categories=[...getCategories()].sort((a,b)=>categoryNumber(a.category)-categoryNumber(b.category)||a.category.localeCompare(b.category));return <main className="page"><p className="eyebrow">Myanmar hymn book</p><h1 className="mt-2 font-serif text-4xl md:text-5xl">Categories</h1><p className="mt-3 text-[var(--muted)]">Browse 33 themes from the source collection.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{categories.map(c=>{const references=[...c.hymns].sort((a,b)=>a.number-b.number);return <section key={c.slug} className="surface p-5"><h2 className="myanmar font-bold">{categoryTitle(c)}</h2><p className="mt-2 text-xs text-[var(--muted)]">{references.length} hymn references</p><div className="mt-4 flex flex-wrap gap-2">{references.map(h=><Link key={h.number} href={`/hymns/my/${h.number}`} className="focus-ring rounded-full bg-[var(--sage-soft)] px-3 py-1.5 text-xs font-bold text-[var(--sage)]">{h.number}</Link>)}</div></section>})}</div></main>}
