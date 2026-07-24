"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, money } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  bookingWarningTitle?: string | null;
  bookingWarningIntro?: string | null;
  bookingWarningInstructions?: string | null;
  bookingWarningContact?: string | null;
  bookingWarningActive?: boolean;
  hasImage?: boolean;
};

type Slot = {
  time: string;
  isAvailable: boolean;
  reason?: string;
};

type AvailabilityNotice = { type: "closed" | "limited"; title: string; message: string };

export function BookingSlotPicker({ services, requirePrecautionAcknowledgement = false }: { services: ServiceOption[]; requirePrecautionAcknowledgement?: boolean }) {
  const [serviceId, setServiceId] = useState(requirePrecautionAcknowledgement ? "" : services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [notice, setNotice] = useState<AvailabilityNotice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [warningService, setWarningService] = useState<ServiceOption | null>(null);
  const [acknowledgedServiceId, setAcknowledgedServiceId] = useState("");
  const selectedService = services.find((service) => service.id === serviceId);

  useEffect(() => {
    if (!warningService) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [warningService]);

  function chooseService(nextServiceId: string) {
    setServiceId(nextServiceId);
    setAcknowledgedServiceId("");
    const service = services.find((item) => item.id === nextServiceId);
    if (requirePrecautionAcknowledgement && service?.bookingWarningActive) setWarningService(service);
    else setWarningService(null);
  }

  useEffect(() => {
    setSelectedTime("");
    setSlots([]);
    setNotice(null);

    if (!serviceId || !date) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/public/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { slots?: Slot[]; notice?: AvailabilityNotice | null }) => {
        setSlots(data.slots ?? []);
        setNotice(data.notice ?? null);
      })
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
          <Select name="serviceId" required value={serviceId} onChange={(event) => chooseService(event.target.value)}>
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {money(service.advanceAmount)} advance
              </option>
            ))}
          </Select>
          <input type="hidden" name="precautionAcknowledgement" value={acknowledgedServiceId} />
          {selectedService ? (
            <div className="grid gap-2 rounded-md border bg-muted/50 p-3 text-sm">
              {selectedService.hasImage ? <Image unoptimized width={720} height={315} src={`/api/public/services/${selectedService.id}/image`} alt={`${selectedService.name} service`} className="mb-2 aspect-[16/7] w-full rounded-lg object-cover" /> : null}
              <div className="font-semibold">{selectedService.name}</div>
              {selectedService.description ? <p className="text-muted-foreground">{selectedService.description}</p> : null}
              <div className="grid gap-1 sm:grid-cols-3">
                <span>Price: <strong>{money(selectedService.price)}</strong></span>
                <span>Advance: <strong>{money(selectedService.advanceAmount)}</strong></span>
                <span>Duration: <strong>{formatDuration(selectedService.durationMinutes)}</strong></span>
              </div>
              {requirePrecautionAcknowledgement && selectedService.bookingWarningActive ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <span className="text-xs font-semibold text-primary">Precautions {acknowledgedServiceId === selectedService.id ? "acknowledged" : "must be reviewed"}</span>
                  <button type="button" className="text-xs font-semibold text-primary underline" onClick={() => setWarningService(selectedService)}>Review service precautions</button>
                </div>
              ) : null}
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

            {notice ? (
              <div className={cn("rounded-md border p-3 text-sm", notice.type === "closed" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900")}>
                <p className="font-semibold">{notice.title}</p>
                <p className="mt-1">{notice.message}</p>
              </div>
            ) : null}

            {!serviceId || !date ? (
              <p className="rounded-md border bg-muted/60 p-3 text-sm text-muted-foreground">Choose a service and date to see available slots.</p>
            ) : slots.length === 0 && !isLoading ? (
              notice?.type === "closed" ? null : <p className="rounded-md border bg-muted/60 p-3 text-sm text-muted-foreground">No available slots for this date.</p>
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
                <p className="mt-1 text-lg font-bold">{formatSelectedAppointment(date, selectedTime)} EAT</p>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">Unavailable slots are hidden because they are already booked, outside working hours, during breaks, or blocked by days off.</p>
          </div>
        </CardContent>
      </Card>
      {warningService ? (
        <ServicePrecautionModal
          service={warningService}
          onChooseAnother={() => { setWarningService(null); setServiceId(""); setAcknowledgedServiceId(""); }}
          onContinue={() => { setAcknowledgedServiceId(warningService.id); setWarningService(null); }}
        />
      ) : null}
    </>
  );
}

function ServicePrecautionModal({ service, onChooseAnother, onContinue }: { service: ServiceOption; onChooseAnother: () => void; onContinue: () => void }) {
  const [understood, setUnderstood] = useState(false);
  const [hasWarningCondition, setHasWarningCondition] = useState(false);
  const instructions = (service.bookingWarningInstructions || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-foreground/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="service-precaution-title">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
        <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {service.hasImage ? <Image unoptimized width={720} height={220} src={`/api/public/services/${service.id}/image`} alt={`${service.name} service`} className="max-h-44 w-full shrink-0 object-cover" /> : null}
          <div className="border-b bg-primary/5 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Before your appointment</p>
            <h2 id="service-precaution-title" className="mt-2 font-display text-3xl font-bold">{service.bookingWarningTitle || service.name}</h2>
            {service.bookingWarningIntro ? <p className="mt-2 leading-7 text-muted-foreground">{service.bookingWarningIntro}</p> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {instructions.length > 0 ? <ul className="list-disc space-y-3 pl-5 leading-6">{instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul> : null}
            {service.bookingWarningContact ? (
              <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5" />Contact Viola before attending</p>
                <p className="mt-2 text-sm leading-6">{service.bookingWarningContact}</p>
              </div>
            ) : null}
            <div className="mt-5 grid gap-3 rounded-xl border bg-muted/30 p-4">
              <label className="flex items-start gap-3 text-sm font-medium"><input className="mt-1" type="checkbox" checked={hasWarningCondition} onChange={(event) => setHasWarningCondition(event.target.checked)} /><span>One of the warning conditions above applies to me.</span></label>
              {hasWarningCondition ? <p className="rounded-lg bg-destructive px-4 py-3 text-sm font-bold text-white">Contact Viola before payment. Choose another service or wait for manual advice before booking.</p> : null}
              <label className="flex items-start gap-3 text-sm font-semibold"><input className="mt-1" type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} /><span>I have read and understood these preparation instructions.</span></label>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Final suitability must be confirmed by the trained practitioner. Do not stop prescribed medication without medical approval.</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-white p-4 sm:px-6">
            <Button asChild variant="outline"><Link href="/precautions" target="_blank"><ExternalLink className="h-4 w-4" />View Full Precautions</Link></Button>
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={onChooseAnother}>Choose another service</Button><Button type="button" disabled={!understood || hasWarningCondition} onClick={onContinue}>I Understand &amp; Continue</Button></div>
          </div>
        </div>
      </div>
    </div>
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
