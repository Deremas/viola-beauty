import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companyName } from "@/lib/brand";
import { publicSite } from "@/lib/courses/site";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = pageMetadata({
  title: "Registration Received",
  description: "Your Viola Brows and Beauty course registration request was received. It is not a confirmed seat, fee, or start date.",
  path: "/courses/registration/received",
  index: false,
});

export default async function RegistrationReceivedPage({ searchParams }: { searchParams: Promise<{ ref?: string; token?: string }> }) {
  const query = await searchParams;
  if (!query.ref) notFound();
  return (
    <PublicShell>
      <script dangerouslySetInnerHTML={{ __html: "try{sessionStorage.removeItem('viola-registration-draft')}catch(e){}" }} />
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Registration received</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">We have your request.</h1>
        <p className="mt-4 leading-7 text-muted-foreground">This does not confirm payment or a place on the course. {companyName} will review it first.</p>
        <dl className="mt-8 space-y-3 rounded-2xl border bg-white p-6">
          <Row label="Registration reference" value={query.ref} />
          <Row label="Contact" value={`${publicSite.phonePrimaryDisplay} / ${publicSite.phoneSecondaryDisplay}`} />
        </dl>
        <Button asChild className="mt-6"><Link href="/courses">Back to courses</Link></Button>
      </main>
    </PublicShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}
