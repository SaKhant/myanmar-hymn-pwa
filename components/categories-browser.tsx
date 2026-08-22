"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { HymnCategory, HymnReference, HymnSummary } from "@/lib/hymns/types";

function categoryNumber(category:string):number {
  const match=category.match(/^\s*(\d+)/);
  return match?Number(match[1]):Number.POSITIVE_INFINITY;
}

function displayNumber(number:number|null):string {
  return number==null?"—":String(number).padStart(3,"0");
}

function HymnRows({references,hymnByNumber}:{references:HymnReference[];hymnByNumber:Map<number|null,HymnSummary>}) {
  return <div className="divide-y divide-[var(--line)]">
    {[...references].sort((a,b)=>a.number-b.number).map(reference=>{
      const hymn=hymnByNumber.get(reference.number);
      const title=hymn?.title||reference.first_line||`Hymn ${displayNumber(reference.number)}`;
      return <Link key={reference.number} href={`/hymns/my/${reference.number}`} className="focus-ring flex min-h-16 items-center gap-4 px-5 py-3 hover:bg-[var(--sage-soft)]">
        <span className="w-12 shrink-0 text-center font-serif text-xl text-[var(--gold)]">{displayNumber(reference.number)}</span>
        <strong className="myanmar min-w-0 flex-1 text-[15px]">{title}</strong>
        <ChevronRight aria-hidden="true" className="shrink-0 text-[var(--muted)]" size={18}/>
      </Link>;
    })}
  </div>;
}

export function CategoriesBrowser({categories,hymns}:{categories:HymnCategory[];hymns:HymnSummary[]}) {
  const [openCategory,setOpenCategory]=useState<string|null>(null);
  const [openSubcategory,setOpenSubcategory]=useState<string|null>(null);
  const hymnByNumber=useMemo(()=>new Map(hymns.map(hymn=>[hymn.number,hymn])),[hymns]);
  const orderedCategories=useMemo(()=>[...categories].sort((a,b)=>categoryNumber(a.category)-categoryNumber(b.category)||a.category.localeCompare(b.category)),[categories]);

  return <div className="mt-6 grid gap-2">
    {orderedCategories.map(category=>{
      const isOpen=openCategory===category.slug;
      const references=[...category.hymns].sort((a,b)=>a.number-b.number);
      const subcategories=category.subcategories??[];
      return <section key={category.slug} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
        <button type="button" onClick={()=>{setOpenCategory(current=>current===category.slug?null:category.slug);setOpenSubcategory(null)}} aria-expanded={isOpen} className="focus-ring myanmar flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left text-base font-bold text-[var(--ink)] hover:bg-[var(--sage-soft)]">
          <span className="min-w-0 flex-1">{category.category}</span>
          {isOpen?<ChevronUp aria-hidden="true" className="shrink-0" size={22}/>:<ChevronDown aria-hidden="true" className="shrink-0" size={22}/>}
        </button>
        {isOpen&&<div className="border-t border-[var(--line)]">
          {subcategories.length>0?<div className="divide-y divide-[var(--line)]">
            {subcategories.map(subcategory=>{
              const subcategoryKey=`${category.slug}:${subcategory.slug}`;
              const subcategoryOpen=openSubcategory===subcategoryKey;
              return <div key={subcategory.slug}>
                <button type="button" onClick={()=>setOpenSubcategory(current=>current===subcategoryKey?null:subcategoryKey)} aria-expanded={subcategoryOpen} className="focus-ring myanmar flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left text-[15px] font-semibold hover:bg-[var(--sage-soft)]">
                  <span className="min-w-0 flex-1">{subcategory.title}</span>
                  <span className="rounded-full bg-[var(--sage-soft)] px-2 py-0.5 text-xs text-[var(--sage)]">{subcategory.hymns.length}</span>
                  {subcategoryOpen?<ChevronUp aria-hidden="true" className="shrink-0" size={19}/>:<ChevronDown aria-hidden="true" className="shrink-0" size={19}/>}
                </button>
                {subcategoryOpen&&<HymnRows references={subcategory.hymns} hymnByNumber={hymnByNumber}/>}
              </div>;
            })}
          </div>:<><p className="px-5 py-3 text-sm font-semibold text-[var(--muted)]">{references.length} hymns</p><HymnRows references={references} hymnByNumber={hymnByNumber}/></>}
        </div>}
      </section>;
    })}
  </div>;
}
