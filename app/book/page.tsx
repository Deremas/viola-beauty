import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createPublicBooking } from "./actions";
import { BankAccountSelector } from "@/components/booking/bank-account-selector";
import { BookingSlotPicker } from "@/components/booking/booking-slot-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicHeader } from "@/components/public/public-header";
import { BookingSubmissionGuard } from "@/components/booking/booking-submission-guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Book a Viola Brows and Beauty appointment online. Choose a service, select an available time, and upload advance payment proof for review.",
  alternates: {
    canonical: "/book",
  },
  openGraph: {
    title: "Book an Appointment | Viola Brows and Beauty",
    description:
      "Choose a service, select an available time, and upload advance payment proof for Viola Brows and Beauty.",
    url: "/book",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retryAfter?: string }>;
}) {
  const query = await searchParams;
  const [services, bankAccounts] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      include: { image: { select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.bankAccount.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { bankName: "asc" } }),
  ]);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Book Appointment</p>
        <h1 className="font-display text-4xl font-bold">Choose service, time, and upload payment proof.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Your booking is reviewed after you upload a clear transfer screenshot.</p>
      </div>

      {query.error ? (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive" role="alert">
          <h2 className="font-display text-lg font-bold">We could not submit this booking</h2>
          <p className="mt-1 text-sm leading-6">{bookingErrorMessage(query.error, query.retryAfter)}</p>
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <h2 className="font-display text-lg font-bold">Advance payment policy</h2>
        <ul className="mt-2 grid gap-1 text-sm leading-6 sm:grid-cols-3 sm:gap-4">
          <li>Payment proof is required for every booking.</li>
          <li>Your appointment is confirmed after staff verifies the advance.</li>
          <li>If you miss a confirmed appointment, it expires. The advance is non-refundable, cannot be reused, and a new booking requires a new advance.</li>
        </ul>
      </div>

      <form id="public-booking-form" action={createPublicBooking} className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <BookingSubmissionGuard formId="public-booking-form" />
        <section className="space-y-6">
          <BookingSlotPicker
            services={services.map((service) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: Number(service.price),
              advanceAmount: Number(service.advanceAmount),
              durationMinutes: service.durationMinutes,
              bufferMinutes: service.bufferMinutes,
              bookingWarningTitle: service.bookingWarningTitle,
              bookingWarningIntro: service.bookingWarningIntro,
              bookingWarningInstructions: service.bookingWarningInstructions,
              bookingWarningContact: service.bookingWarningContact,
              bookingWarningActive: service.bookingWarningActive,
              hasImage: Boolean(service.image),
            }))}
            requirePrecautionAcknowledgement
          />

          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email optional</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note optional</Label>
                <Textarea id="note" name="note" />
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <BankAccountSelector
            accounts={bankAccounts.map((account) => ({
              id: account.id,
              bankName: account.bankName,
              accountName: account.accountName,
              accountNumber: account.accountNumber,
              instructions: account.instructions,
            }))}
          />
          <Button type="submit" pendingText="Sending booking request..." disabled={services.length === 0 || bankAccounts.length === 0}>
            Send booking request
          </Button>
        </aside>
      </form>
      </main>
    </>
  );
}

function bookingErrorMessage(code: string, retryAfter?: string) {
  const messages: Record<string, string> = {
    SLOT_TAKEN: "That time was just booked by someone else. Please choose another available time.",
    SUBMISSION_PROCESSING: "Your request is still being processed. Please wait a moment; this page will recover a saved booking automatically.",
    SUBMISSION_FAILED: "The previous request did not finish. You can safely review the form and submit it again.",
    TOKEN_REUSED: "The booking details changed after submission. Refresh this page and try again.",
    INVALID_SUBMISSION_TOKEN: "This booking form expired. Refresh this page and try again.",
    INVALID_PHONE: "Enter a valid Ethiopian mobile number.",
    SERVICE_UNAVAILABLE: "That service is no longer available. Please select another service.",
    BANK_UNAVAILABLE: "That payment account is no longer available. Please select another account.",
    PRECAUTIONS_REQUIRED: "Please read and accept the selected service precautions.",
    PAST_SLOT: "The selected appointment time has passed. Please choose a future time.",
    PROOF_REQUIRED: "Upload a clear payment proof before sending the booking request.",
    RATE_LIMITED: `Too many booking attempts were received. Please wait ${formatRetryTime(retryAfter)} and try again.`,
  };
  return messages[code] || "An unexpected problem occurred. Your booking may still have been saved, so check your booking status before submitting again.";
}

function formatRetryTime(retryAfter?: string) {
  const seconds = Math.max(1, Number(retryAfter) || 60);
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} minute(s)` : `${seconds} seconds`;
}
