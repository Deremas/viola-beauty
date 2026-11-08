import { pageMetadata } from "@/lib/seo";
import { companyName } from "@/lib/brand";
import { PublicShell } from "@/components/public/public-shell";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${companyName} handles booking details, course registration details, and uploaded payment proof.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-5xl font-semibold text-brand-plum">Privacy Policy</h1>
        <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
          <p>{companyName} collects the name, phone number, and optional email you submit for a service booking or course registration, plus the appointment, course, payment, and note details needed to run that request.</p>
          <p>Payment screenshots are stored so staff can review them. They are not treated as verified until a staff member accepts them. Course and booking records are visible to staff whose role allows it.</p>
          <p>Client result photographs are published only when a consent record is saved with the image. Do not send photographs of other people through a form.</p>
          <p>To ask about your own booking or registration, call the studio numbers on the contact page and have your reference ready.</p>
        </div>
      </main>
    </PublicShell>
  );
}
