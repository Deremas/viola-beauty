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
    <div><h1 className="font-display text-3xl font-bold">Security settings</h1><p className="text-sm text-muted-foreground">Control staff session duration and how many requests one visitor may make. Raw IP addresses are never stored.</p></div>
    <Card><CardHeader><CardTitle>Staff login session</CardTitle></CardHeader><CardContent>
      <form action={saveSecuritySettings} className="grid gap-6">
        <div>
          <Label htmlFor="sessionDurationDays">Keep staff signed in for</Label>
          <div className="mt-2 flex max-w-xs items-center gap-3">
            <Input id="sessionDurationDays" name="sessionDurationDays" type="number" min="1" max="30" defaultValue={settings.sessionDurationDays} required />
            <span className="whitespace-nowrap text-sm font-medium">day(s)</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Staff must sign in again after this time. Allowed range: 1 to 30 days.</p>
        </div>
        <SecurityFields settings={settings} />
        <div className="flex justify-end"><Button type="submit" pendingText="Saving security settings...">Save security settings</Button></div>
      </form>
    </CardContent></Card>
  </div>;
}

function SecurityFields({ settings }: { settings: {
  loginMax: number;
  loginWindowSeconds: number;
  bookingIpMax: number;
  bookingPhoneMax: number;
  bookingWindowSeconds: number;
  statusMax: number;
  statusWindowSeconds: number;
  slotsMax: number;
  slotsWindowSeconds: number;
  uploadMax: number;
  uploadWindowSeconds: number;
} }) {
  return <fieldset className="grid gap-6 rounded-xl border p-4">
    <legend className="px-2 font-display text-lg font-bold">Rate limiting</legend>
    <p className="text-sm text-muted-foreground">Limit repeated requests to protect login, booking, and upload features.</p>
    <LimitRow title="Staff login" maxName="loginMax" maxValue={settings.loginMax} windowName="loginWindowSeconds" windowValue={settings.loginWindowSeconds} />
    <LimitRow title="Booking per visitor" maxName="bookingIpMax" maxValue={settings.bookingIpMax} windowName="bookingWindowSeconds" windowValue={settings.bookingWindowSeconds} />
    <div><Label htmlFor="bookingPhoneMax">Bookings per phone in the booking window</Label><Input className="mt-2 max-w-xs" id="bookingPhoneMax" name="bookingPhoneMax" type="number" min="1" max="50" defaultValue={settings.bookingPhoneMax} required /></div>
    <LimitRow title="Booking status checks" maxName="statusMax" maxValue={settings.statusMax} windowName="statusWindowSeconds" windowValue={settings.statusWindowSeconds} />
    <LimitRow title="Available-slot requests" maxName="slotsMax" maxValue={settings.slotsMax} windowName="slotsWindowSeconds" windowValue={settings.slotsWindowSeconds} />
    <LimitRow title="Payment-proof uploads" maxName="uploadMax" maxValue={settings.uploadMax} windowName="uploadWindowSeconds" windowValue={settings.uploadWindowSeconds} />
  </fieldset>;
}

function LimitRow({ title, maxName, maxValue, windowName, windowValue }: { title: string; maxName: string; maxValue: number; windowName: string; windowValue: number }) {
  return <fieldset className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"><legend className="px-2 font-semibold">{title}</legend><div><Label htmlFor={maxName}>Maximum requests</Label><Input className="mt-2" id={maxName} name={maxName} type="number" min="1" defaultValue={maxValue} required /></div><div><Label htmlFor={windowName}>Time window in seconds</Label><Input className="mt-2" id={windowName} name={windowName} type="number" min="60" max="86400" defaultValue={windowValue} required /></div></fieldset>;
}
