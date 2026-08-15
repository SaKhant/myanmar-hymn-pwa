import { HymnBrowser } from "@/components/hymn-browser";
import { getSummaries } from "@/lib/hymns/data";
export default function YpPage(){ return <HymnBrowser kind="yp" myanmar={getSummaries("yp","my")} myanmarOnly/>; }
