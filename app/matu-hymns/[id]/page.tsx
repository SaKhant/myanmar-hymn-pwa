import Link from "next/link";
import { notFound } from "next/navigation";
import { getHymn } from "@/lib/hymns/data";
import { matuHymns } from "@/lib/hymns/matu-data";
import styles from "./page.module.css";

export default async function MatuHymnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hymn = matuHymns.find((record) => record.id === id || String(record.number) === id);
  if (!hymn || hymn.number === null) notFound();

  const myanmar = getHymn("hymns", "my", String(hymn.number));
  const englishReference = myanmar?.cross_references.Eng?.trim() || hymn.cross_references.Eng?.trim();
  const english = englishReference ? getHymn("hymns", "en", englishReference) : undefined;

  const index = matuHymns.findIndex((record) => record.id === hymn.id);
  const previous = index > 0 ? matuHymns[index - 1] : undefined;
  const next = index >= 0 && index < matuHymns.length - 1 ? matuHymns[index + 1] : undefined;

  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/hymns">
        ← Back to Hymns
      </Link>

      <p className={styles.kicker}>
        <Link href={`/hymns/my/${hymn.number}`}>MY {hymn.number}</Link>
        {englishReference ? (
          <>
            {" • "}
            {english ? (
              <Link href={`/hymns/en/${english.number ?? english.id}`}>ENG {englishReference}</Link>
            ) : (
              <span>ENG {englishReference}</span>
            )}
          </>
        ) : null}
        {" • "}
        <span className={styles.current}>MATU {hymn.number}</span>
      </p>

      <h1 className={styles.title}>{hymn.title || hymn.first_line || `Matu Hymn ${hymn.number}`}</h1>

      <div>
        {hymn.sections.map((section, sectionIndex) => (
          <section className={styles.section} key={`${section.type}-${section.number ?? sectionIndex}-${sectionIndex}`}>
            {section.type === "verse" && section.number !== null ? (
              <div className={styles.badge} aria-label={`Verse ${section.number}`}>
                {section.number}
              </div>
            ) : null}
            <div className={`${styles.lines} ${section.type === "chorus" || section.type === "refrain" ? styles.chorus : ""}`}>
              {section.lines.map((line, lineIndex) => (
                <div key={`${sectionIndex}-${lineIndex}`}>{line || "\u00a0"}</div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <nav className={styles.nav} aria-label="Hymn navigation">
        {previous?.number !== null && previous?.number !== undefined ? (
          <Link href={`/hymns/matu/${previous.number}`}>← Previous {previous.number}</Link>
        ) : (
          <span className={styles.navSpacer} />
        )}
        {next?.number !== null && next?.number !== undefined ? (
          <Link href={`/hymns/matu/${next.number}`}>Next {next.number} →</Link>
        ) : (
          <span className={styles.navSpacer} />
        )}
      </nav>
    </main>
  );
}
