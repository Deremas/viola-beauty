import { PublicHeader } from "@/components/public/public-header";
import { SiteFooter } from "@/components/public/site-footer";
import { publicSite } from "@/lib/courses/site";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const site = publicSite;
  return (
    <>
      <PublicHeader />
      {children}
      <SiteFooter site={site} />
    </>
  );
}
