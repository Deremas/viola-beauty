import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SearchCheck } from "lucide-react";
import { BookingStatusChecker } from "@/components/booking/booking-status-checker";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";

export const metadata: Metadata = {
  title: "Check Booking Status",
  description: "Check the current status of your Viola Brows and Beauty booking request.",
  robots: { index: false, follow: false },
};

export default async function BookingStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code = "" } = await searchParams;

  return (
    <>
      <PublicHeader />
      <main className="min-h-[calc(100vh-65px)] px-5 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Button asChild variant="outline">
          <Link href="/"><ArrowLeft className="h-4 w-4" />Back to Viola</Link>
        </Button>
        <div className="mb-8 mt-8 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm font-semibold text-primary shadow-soft">
            <SearchCheck className="h-4 w-4" />Booking status
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Check your appointment.</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Enter your phone number to see active and previous bookings. Add your booking code when you want to check one exact request.
          </p>
        </div>
        <BookingStatusChecker initialCode={code} />
      </div>
      </main>
    </>
  );
}
