import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl, siteDescription, siteName } from "@/lib/seo";
import "./globals.css";

// Latin cuts of Cormorant Garamond and Manrope, stored in the repo.
// next/font/google downloads Google's stylesheet during `next build`, and that
// stylesheet now uses extensionless font URLs that crash Next.js 15.
const display = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../fonts/manrope-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/manrope-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/manrope-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/manrope-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: siteName,
  title: {
    default: `${siteName} | Beauty Appointment Booking`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Viola Brows and Beauty",
    "brows booking",
    "beauty appointment",
    "brow lamination",
    "nano brows",
    "ombre brows",
    "lash lift",
    "lip blush",
  ],
  authors: [{ name: "Blue Ocean Creatives", url: "https://blueoceancreatives.com/" }],
  creator: "Blue Ocean Creatives",
  publisher: siteName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: `${siteName} | Beauty Appointment Booking`,
    description: siteDescription,
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Beauty Appointment Booking`,
    description: siteDescription,
    images: ["/brand/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#96116F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">{children}</body>
    </html>
  );
}
