import { PublicHeader } from "@/components/public/public-header";
import { SiteFooter } from "@/components/public/site-footer";
import { getSiteContent } from "@/lib/courses/site";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const site = await getSiteContent();
  return (
    <>
      <PublicHeader />
      {children}
      <SiteFooter site={site} />
    </>
  );
}
