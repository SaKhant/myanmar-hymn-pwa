import Link from "next/link";
import { notFound } from "next/navigation";
import { getHymn } from "@/lib/hymns/data";
import { getKachinHymn, kachinHymns } from "@/lib/hymns/kachin-data";
import { matuHymns } from "@/lib/hymns/matu-data";
import styles from "@/app/matu-hymns/[id]/page.module.css";

export function generateStaticParams() {
  return kachinHymns.map((hymn) => ({ id: String(hymn.number) }));
}

export default async function KachinHymnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hymn = getKachinHymn(id);
  if (!hymn || hymn.number === null) notFound();
  const myanmarReference = hymn.cross_references.Myanmar?.trim();
  const myanmar = myanmarReference ? getHymn("hymns", "my", myanmarReference) : undefined;
  const englishReference = hymn.cross_references.Eng?.trim();
  const english = englishReference ? getHymn("hymns", "en", englishReference) : undefined;
  const matu = myanmar
    ? matuHymns.find((record) => String(record.number ?? record.id) === String(myanmar.number ?? myanmar.id))
    : undefined;
  const index = kachinHymns.findIndex((record) => record.id === hymn.id);
  const previous = index > 0 ? kachinHymns[index - 1] : undefined;
  const next = index >= 0 && index < kachinHymns.length - 1 ? kachinHymns[index + 1] : undefined;
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/hymns">← Back to Hymns</Link>
      <p className={styles.kicker}>
        {myanmarReference ? (myanmar ? <Link href={`/hymns/my/${myanmar.id}`}>M{myanmarReference}</Link> : <span>M{myanmarReference}</span>) : null}
        {englishReference ? (english ? <Link href={`/hymns/en/${english.id}${myanmar ? `?from=${encodeURIComponent(myanmar.id)}` : ""}`}>E{englishReference}</Link> : <span>E{englishReference}</span>) : null}
        <span className={styles.current}>KC{hymn.number}</span>
        {matu ? <Link href={`/hymns/matu/${matu.number ?? matu.id}`}>MT{matu.number ?? matu.id}</Link> : null}
      </p>
      <h1 className={styles.title}>{hymn.title || hymn.first_line || `Kachin Hymn ${hymn.number}`}</h1>
      <div>{hymn.sections.map((section, sectionIndex) => (
        <section className={styles.section} key={`${section.type}-${section.number ?? sectionIndex}-${sectionIndex}`}>
          {section.type === "verse" && section.number !== null ? <div className={styles.badge} aria-label={`Verse ${section.number}`}>{section.number}</div> : null}
          <div className={`${styles.lines} ${section.type === "chorus" || section.type === "refrain" ? styles.chorus : ""}`}>
            {section.lines.map((line, lineIndex) => <div key={`${sectionIndex}-${lineIndex}`}>{line || "\u00a0"}</div>)}
          </div>
        </section>
      ))}</div>
      <nav className={styles.nav} aria-label="Hymn navigation">
        {previous?.number !== null && previous?.number !== undefined ? <Link href={`/hymns/kachin/${previous.number}`}>← Previous {previous.number}</Link> : <span className={styles.navSpacer} />}
        {next?.number !== null && next?.number !== undefined ? <Link href={`/hymns/kachin/${next.number}`}>Next {next.number} →</Link> : <span className={styles.navSpacer} />}
      </nav>
    </main>
  );
}
