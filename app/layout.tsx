import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getSiteUrl, siteDescription, siteName } from "@/lib/seo";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">{children}</body>
    </html>
  );
}
