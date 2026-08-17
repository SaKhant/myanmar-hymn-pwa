import MatuHymnBrowser from "@/components/matu-hymn-browser";
import { matuHymns } from "@/lib/hymns/matu-data";

export default function MatuHymnsPage() {
  const hymns = matuHymns
    .filter((hymn): hymn is typeof hymn & { number: number } => hymn.number !== null)
    .map((hymn) => ({
      number: hymn.number,
      title: hymn.title || hymn.first_line || `Matu Hymn ${hymn.number}`,
    }));

  return <MatuHymnBrowser hymns={hymns} />;
}
