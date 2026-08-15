import Link from "next/link";

export function Brand() {
  return <Link href="/" className="focus-ring flex items-center gap-3 rounded-xl" aria-label="Hymn House home">
    <span className="grid size-11 place-items-center rounded-full bg-[var(--sage)] text-xl text-[var(--paper)]">♪</span>
    <span><strong className="block font-serif text-xl tracking-tight">Hymn House</strong><small className="text-[var(--muted)]">Songs for the journey</small></span>
  </Link>;
}
