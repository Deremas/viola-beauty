import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { saveSecuritySettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SecuritySettingsPage() {
  await requireAdmin();
  const settings = await prisma.securitySetting.upsert({ where: { id: "primary" }, update: {}, create: { id: "primary" } });
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="font-display text-3xl font-bold">Security limits</h1><p className="text-sm text-muted-foreground">Control how many requests one visitor may make during each time window. Raw IP addresses are never stored.</p></div>
    <Card><CardHeader><CardTitle>Rate limiting</CardTitle></CardHeader><CardContent>
      <form action={saveSecuritySettings} className="grid gap-6">
        <LimitRow title="Staff login" maxName="loginMax" maxValue={settings.loginMax} windowName="loginWindowSeconds" windowValue={settings.loginWindowSeconds} />
        <LimitRow title="Booking per visitor" maxName="bookingIpMax" maxValue={settings.bookingIpMax} windowName="bookingWindowSeconds" windowValue={settings.bookingWindowSeconds} />
        <div><Label htmlFor="bookingPhoneMax">Bookings per phone in the booking window</Label><Input className="mt-2 max-w-xs" id="bookingPhoneMax" name="bookingPhoneMax" type="number" min="1" max="50" defaultValue={settings.bookingPhoneMax} required /></div>
        <LimitRow title="Booking status checks" maxName="statusMax" maxValue={settings.statusMax} windowName="statusWindowSeconds" windowValue={settings.statusWindowSeconds} />
        <LimitRow title="Available-slot requests" maxName="slotsMax" maxValue={settings.slotsMax} windowName="slotsWindowSeconds" windowValue={settings.slotsWindowSeconds} />
        <LimitRow title="Payment-proof uploads" maxName="uploadMax" maxValue={settings.uploadMax} windowName="uploadWindowSeconds" windowValue={settings.uploadWindowSeconds} />
        <div className="flex justify-end"><Button type="submit" pendingText="Saving security limits...">Save security limits</Button></div>
      </form>
    </CardContent></Card>
  </div>;
}

function LimitRow({ title, maxName, maxValue, windowName, windowValue }: { title: string; maxName: string; maxValue: number; windowName: string; windowValue: number }) {
  return <fieldset className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"><legend className="px-2 font-semibold">{title}</legend><div><Label htmlFor={maxName}>Maximum requests</Label><Input className="mt-2" id={maxName} name={maxName} type="number" min="1" defaultValue={maxValue} required /></div><div><Label htmlFor={windowName}>Time window in seconds</Label><Input className="mt-2" id={windowName} name={windowName} type="number" min="60" max="86400" defaultValue={windowValue} required /></div></fieldset>;
}
