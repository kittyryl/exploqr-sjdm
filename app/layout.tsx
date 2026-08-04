import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import InstallPrompt from "@/components/layout/InstallPrompt";
import Footer from "@/components/layout/Footer";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// Main heading font. Italic is loaded too, since the hero text needs true
// italic letters, not just slanted regular ones.
const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = Space_Mono({
  variable: "--font-mono-face",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Share previews (Facebook, Twitter, etc.) need the site's full address, not
// a shortcut one. Use the stable live-site address if we have it, so preview
// builds don't accidentally point at the wrong site.
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
  // Matches the browser's toolbar colour to the page background in each theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf5ea" },
    { media: "(prefers-color-scheme: dark)", color: "#17110a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
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
