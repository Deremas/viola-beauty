import Link from "next/link";
import { CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/lib/status";
import { CopyBookingCode } from "@/components/booking/copy-booking-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    select: { bookingCode: true, status: true, payment: { select: { paymentStatus: true } } },
  });
  const bookingCode = booking?.bookingCode || code;

  return (
    <main className="flex min-h-screen items-center px-5 py-10 sm:px-6">
      <Card className="mx-auto w-full max-w-3xl overflow-hidden bg-white/90">
        <div className="bg-foreground px-6 py-8 text-white sm:px-8">
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">Request received</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your booking was submitted.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/70">
            Your appointment is not confirmed yet. Viola will review your payment proof and update the booking status.
          </p>
        </div>

        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="rounded-2xl border bg-muted/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">This is your booking code</p>
            <p className="mt-2 break-all font-display text-2xl font-bold sm:text-3xl">{bookingCode}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Copy and keep this code. Use it with your phone number to check this exact booking later.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <CopyBookingCode code={bookingCode} />
              <div className="flex flex-wrap gap-2">
                {booking ? <StatusBadge status={booking.status} /> : null}
                {booking?.payment ? <StatusBadge status={booking.payment.paymentStatus} /> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-semibold">Payment review comes first</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Staff confirm the appointment after checking the uploaded proof.</p>
            </div>
            <div className="rounded-xl border p-4">
              <Search className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-semibold">Check again at any time</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Use this code and your booking phone number to see the latest update.</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild variant="outline"><Link href="/">Back to home</Link></Button>
            <Button asChild>
              <Link href={`/booking-status?code=${encodeURIComponent(bookingCode)}`}>
                <Search className="h-4 w-4" />Check booking status
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
