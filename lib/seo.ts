import type { Metadata } from "next";

export const siteName = "Viola Brows and Beauty";
export const siteDescription =
  "Viola Brows and Beauty in Addis Ababa offers professional beauty treatments, online service booking, and practical courses with student registration.";

const shareImage = { url: "/brand/og.png", width: 1200, height: 630, alt: siteName };

export function pageMetadata({
  title,
  description,
  path,
  index = true,
  absolute = false,
  canonical = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  absolute?: boolean;
  canonical?: boolean;
}): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const shareTitle = absolute || title.includes(siteName) ? title : `${title} | ${siteName}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    ...(canonical ? { alternates: { canonical: canonicalPath } } : {}),
    openGraph: {
      title: shareTitle,
      description,
      ...(canonical ? { url: canonicalPath } : {}),
      siteName,
      type: "website",
      locale: "en_US",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [shareImage.url],
    },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? site : `${site}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}
