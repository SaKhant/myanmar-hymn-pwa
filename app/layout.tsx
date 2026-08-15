import type { Metadata, Viewport } from "next";
import { Padauk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ServiceWorker } from "@/components/service-worker";
import { AppSplash } from "@/components/app-splash";
import { OfflineLibraryPrompt } from "@/components/offline-library-prompt";
import { OfflineNavigation } from "@/components/offline-navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_KEY } from "@/lib/storage";

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

const themeInitializer=`(()=>{try{const value=localStorage.getItem(${JSON.stringify(THEME_KEY)});let theme;try{theme=value?JSON.parse(value):null}catch{theme=value}if(theme!=="light"&&theme!=="dark")theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;const color=theme==="dark"?"#151a17":"#fbfaf6";document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>meta.setAttribute("content",color))}catch{}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={padauk.variable} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeInitializer}}/></head><body><ThemeProvider><AppSplash/><OfflineLibraryPrompt/><OfflineNavigation/><ServiceWorker/><div className="shell"><Navigation />{children}</div></ThemeProvider></body></html>;
}
