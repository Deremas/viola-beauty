"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ServiceOption = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  advanceAmount: number;
  durationMinutes: number;
  bufferMinutes: number;
};

type Slot = {
  time: string;
  isAvailable: boolean;
  reason?: string;
};

export function BookingSlotPicker({ services }: { services: ServiceOption[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const selectedService = services.find((service) => service.id === serviceId);

  useEffect(() => {
    setSelectedTime("");
    setSlots([]);

    if (!serviceId || !date) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/public/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { slots?: Slot[] }) => setSlots(data.slots ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") setSlots([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [serviceId, date]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Service</CardTitle>
          <CardDescription>Active services are loaded from the database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select name="serviceId" required value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {money(service.advanceAmount)} advance
              </option>
            ))}
          </Select>
          {selectedService ? (
            <div className="grid gap-2 rounded-md border bg-muted/50 p-3 text-sm">
              <div className="font-semibold">{selectedService.name}</div>
              {selectedService.description ? <p className="text-muted-foreground">{selectedService.description}</p> : null}
              <div className="grid gap-1 sm:grid-cols-3">
                <span>Price: <strong>{money(selectedService.price)}</strong></span>
                <span>Advance: <strong>{money(selectedService.advanceAmount)}</strong></span>
                <span>Duration: <strong>{selectedService.durationMinutes} min</strong></span>
              </div>
            </div>
          ) : null}
          {services.length === 0 ? <p className="text-sm text-muted-foreground">No active services yet. Add services in admin settings.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date and Time</CardTitle>
          <CardDescription>Only available slots are shown to clients.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <input type="hidden" name="time" value={selectedTime} required />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Available slots</Label>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            </div>

            {!serviceId || !date ? (
              <p className="rounded-md border bg-muted/60 p-3 text-sm text-muted-foreground">Choose a service and date to see available slots.</p>
            ) : slots.length === 0 && !isLoading ? (
              <p className="rounded-md border bg-muted/60 p-3 text-sm text-muted-foreground">No available slots for this date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={false}
                    title={slot.reason}
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                      selectedTime === slot.time && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {formatSlotTime(slot.time)}
                  </button>
                ))}
              </div>
            )}

            {date && selectedTime ? (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Selected appointment</p>
                <p className="mt-1 text-lg font-bold">{formatSelectedAppointment(date, selectedTime)}</p>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">Unavailable slots are hidden because they are already booked, outside working hours, during breaks, or blocked by days off.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function formatSlotTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2020, 0, 1, hour, minute)));
}

function formatSelectedAppointment(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return `${dateLabel}, ${formatSlotTime(time)}`;
}
