import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { securityHash } from "@/lib/security";
import { timingSafeEqual } from "crypto";
import { companyName } from "@/lib/brand";
import { getSiteContent } from "@/lib/courses/site";
import { formatStatus } from "@/lib/format";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Registration Received",
  description: "Your Viola Brows and Beauty course registration request was received. It is not a confirmed seat, fee, or start date.",
  path: "/courses/registration/received",
  index: false,
});

function sameHash(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function RegistrationReceivedPage({ searchParams }: { searchParams: Promise<{ ref?: string; token?: string }> }) {
  const query = await searchParams;
  if (!query.ref || !query.token) notFound();
  const registration = await prisma.courseRegistration.findUnique({
    where: { registrationNumber: query.ref },
    include: { course: true, student: true },
  });
  if (!registration || !sameHash(registration.accessTokenHash, securityHash(query.token))) notFound();
  const site = await getSiteContent();
  return (
    <PublicShell>
      <script dangerouslySetInnerHTML={{ __html: "try{sessionStorage.removeItem('viola-registration-draft')}catch(e){}" }} />
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Registration received</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-plum">We have your request.</h1>
        <p className="mt-4 leading-7 text-muted-foreground">This does not confirm payment or a place on the course. {companyName} will review it first.</p>
        <dl className="mt-8 space-y-3 rounded-2xl border bg-white p-6">
          <Row label="Registration reference" value={registration.registrationNumber} />
          <Row label="Student" value={registration.submittedName} />
          <Row label="Course" value={registration.course.name} />
          <Row label="Status" value={formatStatus(registration.registrationStatus)} />
          <Row label="Contact" value={`${site.phonePrimaryDisplay} / ${site.phoneSecondaryDisplay}`} />
        </dl>
        <Button asChild className="mt-6"><Link href="/courses">Back to courses</Link></Button>
      </main>
    </PublicShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}
