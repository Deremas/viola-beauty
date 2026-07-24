"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, CreditCard, Download, ExternalLink, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/lib/status";
import { CopyBookingCode } from "@/components/booking/copy-booking-code";

type BookingStatusResult = {
  bookingCode: string;
  bookingStatus: string;
  bookingStatusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  service: string;
  appointmentTimestamp: string;
  appointment: string;
  lastUpdated: string;
  message: string;
  advanceForfeited: boolean;
  advanceForfeitedAmount: number;
  precaution: {
    title: string;
    intro: string;
    instructions: string[];
    contact: string;
  } | null;
  hasFullPrecautions: boolean;
};

export function BookingStatusChecker({ initialCode = "" }: { initialCode?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingStatusResult | null>(null);
  const [results, setResults] = useState<BookingStatusResult[] | null>(null);

  async function checkStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setResults(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public/booking-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: formData.get("bookingCode"),
          phone: formData.get("phone"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not check this booking.");
      if (Array.isArray(data.bookings)) setResults(data.bookings);
      else setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not check this booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="h-fit bg-white/85">
        <CardContent className="p-6">
          <form onSubmit={checkStatus} className="grid gap-4">
            <div>
              <Label htmlFor="bookingCode">Booking code optional</Label>
              <Input
                className="mt-2 uppercase"
                id="bookingCode"
                name="bookingCode"
                defaultValue={initialCode}
                placeholder="VB-260716-8758"
                autoComplete="off"
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Leave this empty to see all bookings connected to your phone number.
              </p>
            </div>
            <div>
              <Label htmlFor="bookingPhone">Phone number used during booking</Label>
              <Input
                className="mt-2"
                id="bookingPhone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="0912345678"
                autoComplete="tel"
                required
              />
            </div>
            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4" />
                {loading ? "Checking booking..." : "Check booking status"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div aria-live="polite">
        {result ? <BookingStatusDetails result={result} /> : null}
        {results ? <BookingStatusList results={results} /> : null}
        {!result && !results ? <StatusHelp /> : null}
      </div>
    </div>
  );
}

function BookingStatusList({ results }: { results: BookingStatusResult[] }) {
  if (results.length === 0) {
    return (
      <Card className="bg-white/80">
        <CardContent className="p-6">
          <h2 className="font-display text-2xl font-bold">No bookings found</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            We could not find any bookings for this phone number.
          </p>
        </CardContent>
      </Card>
    );
  }

  const closedStatuses = new Set(["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED", "NO_SHOW"]);
  const activeBookings = results
    .filter((booking) => !closedStatuses.has(booking.bookingStatus))
    .sort((a, b) => Date.parse(a.appointmentTimestamp) - Date.parse(b.appointmentTimestamp));
  const previousBookings = results
    .filter((booking) => closedStatuses.has(booking.bookingStatus))
    .sort((a, b) => Date.parse(b.appointmentTimestamp) - Date.parse(a.appointmentTimestamp));

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-2xl font-bold">Your bookings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Found {results.length} booking{results.length === 1 ? "" : "s"} for this phone number.
        </p>
      </div>
      {activeBookings.length > 0 ? <BookingGroup title="Active bookings" bookings={activeBookings} /> : null}
      {previousBookings.length > 0 ? <BookingGroup title="Previous bookings" bookings={previousBookings} /> : null}
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
}: {
  title: string;
  bookings: BookingStatusResult[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{bookings.length}</span>
      </div>
      <div className="space-y-3">
        {bookings.map((booking) => <CompactBooking key={booking.bookingCode} booking={booking} />)}
      </div>
    </section>
  );
}

function CompactBooking({ booking }: { booking: BookingStatusResult }) {
  return (
    <details className="group overflow-hidden rounded-xl border bg-white/90 shadow-soft">
      <summary className="cursor-pointer list-none p-4 marker:hidden hover:bg-muted/30">
        <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{booking.bookingCode}</p>
            <p className="mt-1 truncate font-bold">{booking.service}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Appointment</p>
            <p className="mt-1 font-semibold">{booking.appointment}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge status={booking.bookingStatus} />
            <span className="text-sm font-semibold text-primary group-open:hidden">View details</span>
            <span className="hidden text-sm font-semibold text-primary group-open:inline">Hide details</span>
          </div>
        </div>
      </summary>
      <div className="border-t bg-background/50 p-4">
        <p className="rounded-lg bg-primary/5 p-3 text-sm font-medium leading-6 text-primary">{booking.message}</p>
        {booking.advanceForfeited ? <ExpiredNoShowAction /> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniDetail label="Booking status"><StatusBadge status={booking.bookingStatus} /></MiniDetail>
          <MiniDetail label="Payment status"><StatusBadge status={booking.paymentStatus} /></MiniDetail>
          <MiniDetail label="Last updated"><span className="font-semibold">{booking.lastUpdated}</span></MiniDetail>
        </div>
        <div className="mt-4 flex justify-end"><CopyBookingCode code={booking.bookingCode} /></div>
        <PrecautionActions booking={booking} />
      </div>
    </details>
  );
}

function MiniDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function BookingStatusDetails({ result }: { result: BookingStatusResult }) {
  return (
    <Card className="overflow-hidden bg-white/90">
      <div className="bg-foreground p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Booking {result.bookingCode}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold">{result.bookingStatusLabel}</h2>
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">{result.paymentStatusLabel}</span>
        </div>
      </div>
      <CardContent className="grid gap-5 p-6">
        <p className="rounded-xl bg-primary/5 p-4 font-medium leading-7 text-primary">{result.message}</p>
        {result.advanceForfeited ? <ExpiredNoShowAction /> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusItem icon={CheckCircle2} label="Service" value={result.service} />
          <StatusItem icon={CalendarDays} label="Appointment" value={result.appointment} />
          <StatusItem icon={CreditCard} label="Payment status" value={result.paymentStatusLabel} />
          <StatusItem icon={Clock3} label="Last updated" value={result.lastUpdated} />
        </div>
        <PrecautionActions booking={result} />
      </CardContent>
    </Card>
  );
}

function PrecautionActions({ booking }: { booking: BookingStatusResult }) {
  const [open, setOpen] = useState(false);
  if (!booking.precaution && !booking.hasFullPrecautions) return null;

  return (
    <>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {booking.precaution ? <Button type="button" variant="outline" onClick={() => setOpen(true)}>View service precautions</Button> : null}
        {booking.hasFullPrecautions ? <Button asChild variant="outline"><Link href="/precautions" target="_blank"><ExternalLink className="h-4 w-4" />Open full precautions</Link></Button> : null}
        {booking.hasFullPrecautions ? <Button asChild variant="outline"><a href="/api/public/precautions/current?download=1"><Download className="h-4 w-4" />Download precautions</a></Button> : null}
      </div>
      {open && booking.precaution ? (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-foreground/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="mx-auto flex min-h-full max-w-2xl items-center">
            <div className="w-full rounded-2xl border bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b p-5">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your saved service precautions</p><h2 className="mt-2 font-display text-2xl font-bold">{booking.precaution.title}</h2></div>
                <Button type="button" variant="outline" size="icon" title="Close precautions" onClick={() => setOpen(false)}><X className="h-4 w-4" /><span className="sr-only">Close precautions</span></Button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-5">
                {booking.precaution.intro ? <p className="leading-7 text-muted-foreground">{booking.precaution.intro}</p> : null}
                {booking.precaution.instructions.length ? <ul className="mt-4 list-disc space-y-3 pl-5 leading-6">{booking.precaution.instructions.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                {booking.precaution.contact ? <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive"><p className="font-bold">Contact Viola before attending</p><p className="mt-2 text-sm leading-6">{booking.precaution.contact}</p></div> : null}
              </div>
              <div className="flex justify-end border-t p-4"><Button type="button" onClick={() => setOpen(false)}>Close precautions</Button></div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ExpiredNoShowAction() {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">A new advance is required</p>
          <p className="mt-1 text-sm leading-6">The previous advance expired with the missed appointment and cannot be reused or refunded.</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button asChild><Link href="/book">Book and pay a new advance</Link></Button>
      </div>
    </div>
  );
}

function StatusHelp() {
  return (
    <Card className="bg-white/70">
      <CardContent className="p-6">
        <h2 className="font-display text-2xl font-bold">What you can check</h2>
        <div className="mt-5 grid gap-4">
          {[
            ["Payment review", "See whether your uploaded payment proof is still waiting, accepted, or rejected."],
            ["Booking confirmation", "See when Viola confirms your appointment."],
            ["Appointment changes", "See the current date and time after any rescheduling."],
          ].map(([title, text], index) => (
            <div key={title} className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border bg-white p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
              <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
