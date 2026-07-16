"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BookingStatusResult = {
  bookingCode: string;
  bookingStatus: string;
  bookingStatusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  service: string;
  appointment: string;
  lastUpdated: string;
  message: string;
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
                Leave this empty to see every active booking for your phone number.
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
  const activeBookings = results.filter((booking) => !closedStatuses.has(booking.bookingStatus));
  const previousBookings = results.filter((booking) => closedStatuses.has(booking.bookingStatus));

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-2xl font-bold">Your bookings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Found {results.length} booking{results.length === 1 ? "" : "s"} for this phone number.
        </p>
      </div>
      <BookingGroup
        title="Active bookings"
        emptyText="No active bookings for this phone number."
        bookings={activeBookings}
      />
      <BookingGroup
        title="Previous bookings"
        emptyText="No previous bookings for this phone number."
        bookings={previousBookings}
      />
    </div>
  );
}

function BookingGroup({
  title,
  emptyText,
  bookings,
}: {
  title: string;
  emptyText: string;
  bookings: BookingStatusResult[];
}) {
  return (
    <section className="space-y-4">
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {bookings.length === 0 ? (
        <p className="rounded-xl border bg-white/70 p-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        bookings.map((booking) => <BookingStatusDetails key={booking.bookingCode} result={booking} />)
      )}
    </section>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusItem icon={CheckCircle2} label="Service" value={result.service} />
          <StatusItem icon={CalendarDays} label="Appointment" value={result.appointment} />
          <StatusItem icon={CreditCard} label="Payment status" value={result.paymentStatusLabel} />
          <StatusItem icon={Clock3} label="Last updated" value={result.lastUpdated} />
        </div>
      </CardContent>
    </Card>
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
