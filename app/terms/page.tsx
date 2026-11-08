import { pageMetadata } from "@/lib/seo";
import { companyName } from "@/lib/brand";
import { PublicShell } from "@/components/public/public-shell";

export const metadata = pageMetadata({
  title: "Terms",
  description: `Booking and course registration terms for ${companyName}, including payment review and what a registration request does not confirm.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-5xl font-semibold text-brand-plum">Terms</h1>
        <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
          <p>A service booking is a request. It is confirmed only after {companyName} reviews the advance payment proof. The booking page states the advance rule for missed appointments.</p>
          <p>A course registration is also a request. It does not reserve a seat, set a fee, or confirm a start date. Staff review the request, record any payment separately, and update class progress when the class actually starts and finishes.</p>
          <p>Fees and dates shown on the website are only those the studio has chosen to publish. Unpublished fees are confirmed during review.</p>
          <p>These pages do not issue certificates or state an accreditation.</p>
        </div>
      </main>
    </PublicShell>
  );
}
