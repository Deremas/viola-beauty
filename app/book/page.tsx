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

export default async function BookPage() {
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

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <h2 className="font-display text-lg font-bold">Advance payment policy</h2>
        <ul className="mt-2 grid gap-1 text-sm leading-6 sm:grid-cols-3 sm:gap-4">
          <li>Payment proof is required for every booking.</li>
          <li>Your appointment is confirmed after staff verifies the advance.</li>
          <li>If you miss a confirmed appointment, it expires. The advance is non-refundable, cannot be reused, and a new booking requires a new advance.</li>
        </ul>
      </div>

      <form action={createPublicBooking} className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
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
