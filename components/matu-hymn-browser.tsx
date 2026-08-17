"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "@/app/hymns/matu/matu-browser.module.css";

type MatuListItem = {
  number: number;
  title: string;
};

export default function MatuHymnBrowser({ hymns }: { hymns: MatuListItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return hymns;
    return hymns.filter(
      (hymn) => String(hymn.number).includes(normalized) || hymn.title.toLocaleLowerCase().includes(normalized),
    );
  }, [hymns, query]);

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Hymnal.net</p>
      <div className={styles.headingRow}>
        <h1 className={styles.title}>Matu Hymns</h1>
        <div className={styles.language} aria-label="Hymn language">
          <Link href="/hymns">MY</Link>
          <span aria-hidden="true">•</span>
          <span className={styles.current}>MATU</span>
        </div>
      </div>

      <input
        className={styles.search}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Matu hymns"
        aria-label="Search Matu hymns"
      />
      <p className={styles.count}>{filtered.length} hymns</p>

      <div className={styles.list}>
        {filtered.map((hymn) => (
          <Link className={styles.item} href={`/hymns/matu/${hymn.number}`} key={hymn.number}>
            <span className={styles.number}>{String(hymn.number).padStart(3, "0")}</span>
            <span className={styles.name}>{hymn.title}</span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? <div className={styles.empty}>No hymns found.</div> : null}
    </main>
  );
}
