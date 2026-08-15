import { HymnBrowser } from "@/components/hymn-browser";
import { getSummaries } from "@/lib/hymns/data";

export default async function HymnsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params=await searchParams;
  return <HymnBrowser kind="hymns" myanmar={getSummaries("hymns","my")} initialQuery={params.q||""}/>;
}
