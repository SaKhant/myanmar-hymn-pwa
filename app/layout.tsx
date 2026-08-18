import type { Metadata, Viewport } from "next";
import { Padauk } from "next/font/google";
import "./globals.css";
import "./design-trial.css";
import { Navigation } from "@/components/navigation";
import { ServiceWorker } from "@/components/service-worker";
import { AppSplash } from "@/components/app-splash";
import { OfflineLibraryPrompt } from "@/components/offline-library-prompt";
import { OfflineNavigation } from "@/components/offline-navigation";
import { OfflineApp } from "@/components/offline-app";

const SHOW_MENU_NAV = true;
const SHOW_HYMN_SECTION_SELECTOR = false;

const padauk = Padauk({
  weight: ["400", "700"],
  subsets: ["myanmar"],
  display: "swap",
  variable: "--font-padauk",
  fallback: ["Myanmar Text", "Noto Sans Myanmar", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Hymn House", template: "%s · Hymn House" },
  description: "Myanmar and English hymns for worship, reading, and singing.",
  applicationName: "Hymn House",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Hymn House", statusBarStyle: "default" },
  icons: { icon: [{ url:"/icon-192.png", sizes:"192x192", type:"image/png" },{ url:"/icon-512.png", sizes:"512x512", type:"image/png" }], apple: "/icon-192.png" },
};
export const viewport: Viewport = { themeColor:"#fbfaf6", width:"device-width", initialScale:1, viewportFit:"cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={padauk.variable}><body>{!SHOW_HYMN_SECTION_SELECTOR&&<style>{`[aria-label="Hymn section"]{display:none!important}`}</style>}<AppSplash/><OfflineLibraryPrompt/>{SHOW_MENU_NAV&&<OfflineNavigation/>}<ServiceWorker/><div className="shell" style={SHOW_MENU_NAV?undefined:{paddingLeft:0,paddingBottom:0}}>{SHOW_MENU_NAV&&<Navigation/>}<OfflineApp/>{children}</div></body></html>;
}
