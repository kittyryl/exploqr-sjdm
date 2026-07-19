import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Space_Mono,
} from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import InstallPrompt from "@/components/layout/InstallPrompt";
import Footer from "@/components/layout/Footer";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-mono-face",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Needed so og:image/twitter:image resolve to an absolute URL — social
// scrapers won't follow a relative one. Vercel sets these automatically per
// deploy; VERCEL_PROJECT_PRODUCTION_URL is the stable production domain
// (unlike VERCEL_URL, which is per-deployment and would break on preview
// builds pointing at the wrong host).
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ExploQR SJDM — Tourism guide to San Jose del Monte, Bulacan",
  description:
    "An interactive map guide to San Jose del Monte, Bulacan: pilgrimage shrines, Mt. Balagbag, Kaytitinga Falls, adventure camps, and more — with directions to each spot.",
  openGraph: {
    title: "ExploQR SJDM",
    description:
      "Explore the tourist spots of San Jose del Monte, Bulacan on an interactive map — shrines, summits, falls, and fairways.",
    type: "website",
    locale: "en_PH",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ExploQR SJDM",
  },
};

export const viewport: Viewport = {
  // Matches the page's own paper in each theme, so the browser/OS chrome
  // doesn't sit as a bright bar above a dark app.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#141917" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ThemeProvider>
          <LocaleProvider>
            <ServiceWorkerRegister />
            {children}
            <InstallPrompt />
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
