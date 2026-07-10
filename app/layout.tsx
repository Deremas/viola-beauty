import type { Metadata } from "next";
import { getSiteUrl, siteDescription, siteName } from "@/lib/seo";
import "./globals.css";

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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: `${siteName} | Beauty Appointment Booking`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Beauty Appointment Booking`,
    description: siteDescription,
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
