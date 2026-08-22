"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { HymnCategory, HymnSummary } from "@/lib/hymns/types";

function categoryNumber(category:string):number {
  const match=category.match(/^\s*(\d+)/);
  return match?Number(match[1]):Number.POSITIVE_INFINITY;
}

function displayNumber(number:number|null):string {
  return number==null?"—":String(number).padStart(3,"0");
}

export function CategoriesBrowser({categories,hymns}:{categories:HymnCategory[];hymns:HymnSummary[]}) {
  const [openCategory,setOpenCategory]=useState<string|null>(null);
  const hymnByNumber=useMemo(()=>new Map(hymns.map(hymn=>[hymn.number,hymn])),[hymns]);
  const orderedCategories=useMemo(()=>[...categories].sort((a,b)=>categoryNumber(a.category)-categoryNumber(b.category)||a.category.localeCompare(b.category)),[categories]);

  return <div className="mt-6 grid gap-2">
    {orderedCategories.map(category=>{
      const isOpen=openCategory===category.slug;
      const references=[...category.hymns].sort((a,b)=>a.number-b.number);
      return <section key={category.slug} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
        <button type="button" onClick={()=>setOpenCategory(current=>current===category.slug?null:category.slug)} aria-expanded={isOpen} className="focus-ring myanmar flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left text-base font-bold text-[var(--ink)] hover:bg-[var(--sage-soft)]">
          <span className="min-w-0 flex-1">{category.category}</span>
          {isOpen?<ChevronUp aria-hidden="true" className="shrink-0" size={22}/>:<ChevronDown aria-hidden="true" className="shrink-0" size={22}/>}
        </button>
        {isOpen&&<div className="border-t border-[var(--line)]">
          <p className="px-5 py-3 text-sm font-semibold text-[var(--muted)]">{references.length} hymns</p>
          <div className="divide-y divide-[var(--line)]">
            {references.map(reference=>{
              const hymn=hymnByNumber.get(reference.number);
              const title=hymn?.title||reference.first_line||`Hymn ${displayNumber(reference.number)}`;
              return <Link key={reference.number} href={`/hymns/my/${reference.number}`} className="focus-ring flex min-h-16 items-center gap-4 px-5 py-3 hover:bg-[var(--sage-soft)]">
                <span className="w-12 shrink-0 text-center font-serif text-xl text-[var(--gold)]">{displayNumber(reference.number)}</span>
                <strong className="myanmar min-w-0 flex-1 text-[15px]">{title}</strong>
                <ChevronRight aria-hidden="true" className="shrink-0 text-[var(--muted)]" size={18}/>
              </Link>;
            })}
          </div>
        </div>}
      </section>;
    })}
  </div>;
}
