import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { brand } from "@/lib/brand";
import { formatEthiopianPhone } from "@/lib/phone";
import { getBookingSlotInterval } from "@/lib/booking-settings";
import { saveStudioHours, saveWebsiteSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const messages: Record<string, string> = {
  email: "Enter a valid email, or leave it blank.",
  phone: "Enter both phone numbers as Ethiopian mobile numbers.",
  map: "The map link must be an https Google Maps address.",
  social: "Social links must start with https, or be left blank.",
  hours: "An open day needs a closing time later than its opening time.",
  "hours-step": "Use times that match the appointment interval, such as 09:00 or 09:30.",
};

export default async function WebsiteSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("MANAGE_WEBSITE");
  const query = await searchParams;
  const [settings, hours, interval] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: "primary" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
    getBookingSlotInterval(),
  ]);
  const address = settings?.addressLine || brand.addressLine;
  const city = settings?.city || brand.city;
  const phones = [settings?.phonePrimary || brand.phonePrimary, settings?.phoneSecondary || brand.phoneSecondary];
  const socials = [
    ["Instagram", settings?.instagramUrl || ""],
    ["Facebook", settings?.facebookUrl || ""],
    ["TikTok", settings?.tiktokUrl || ""],
  ] as const;
  const mapUrl = settings?.mapUrl || brand.mapUrl;
  const rows = dayNames.map((day, dayOfWeek) => {
    const hour = hours.find((item) => item.dayOfWeek === dayOfWeek);
    const open = hour?.isOpen ?? dayOfWeek !== 0;
    return {
      day,
      dayOfWeek,
      open,
      openingTime: hour?.openingTime || (dayOfWeek === 6 ? "09:00" : "09:00"),
      closingTime: hour?.closingTime || (dayOfWeek === 6 ? "17:00" : "18:00"),
      label: !hour ? "Not saved yet" : open ? `${hour.openingTime}–${hour.closingTime}` : "Closed",
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Website</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">One place for the public address, phones, social profiles, map link, and studio hours. Hours saved here also set the appointment calendar.</p>
        </div>
        <Button asChild variant="outline"><Link href="/contact">View contact page</Link></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/admin/website/services">Service pages</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/website/gallery">Gallery</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/website/testimonials">Testimonials</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/website/faqs">Questions</Link></Button>
      </div>
      {query.error ? <p className="rounded-lg border border-destructive/30 bg-white p-3 text-sm text-destructive" role="alert">{messages[query.error] || "The website details could not be saved."}</p> : null}
      {query.saved ? <p className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand-plum" role="status">{query.saved === "hours" ? "Studio hours are updated on the contact page and the booking calendar." : "Public contact details are updated."}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>What the website shows</CardTitle>
          <CardDescription>These are the values visitors see now.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Detail</Th><Th>Public value</Th><Th>Where</Th></tr></thead>
            <tbody>
              <tr><Td>Address</Td><Td>{address}, {city}</Td><Td>Contact, footer, homepage</Td></tr>
              {phones.map((phone, index) => <tr key={`${index}-${phone}`}><Td>{index === 0 ? "Primary phone" : "Second phone"}</Td><Td>{formatEthiopianPhone(phone)}</Td><Td>Contact, footer, homepage</Td></tr>)}
              <tr><Td>Email</Td><Td>{settings?.emailVerified && settings.contactEmail ? settings.contactEmail : "Hidden"}</Td><Td>Contact and footer, only after it is marked verified</Td></tr>
              {socials.map(([name, href]) => <tr key={name}><Td>{name}</Td><Td className="max-w-sm break-all">{href || "Hidden"}</Td><Td>Contact and footer</Td></tr>)}
              <tr><Td>Map link</Td><Td className="max-w-sm break-all">{mapUrl}</Td><Td>Opens from the map and the address</Td></tr>
              {rows.map((row) => <tr key={row.day}><Td>{row.day}</Td><Td>{row.label}</Td><Td>Contact hours and booking times</Td></tr>)}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <form action={saveWebsiteSettings} className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact and location</CardTitle>
            <CardDescription>The map picture stays the Viola place. This link is what opens when someone clicks the map.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Address" name="addressLine" defaultValue={address} />
            <Field label="City" name="city" defaultValue={city} />
            <Field label="Primary phone" name="phonePrimary" defaultValue={phones[0]} />
            <Field label="Second phone" name="phoneSecondary" defaultValue={phones[1]} />
            <Field label="Map link" name="mapUrl" defaultValue={settings?.mapUrl || brand.mapUrl} />
            <Field label="Hours note" name="hoursNote" defaultValue={settings?.hoursNote || ""} placeholder="Optional line under the phones" />
            <Field label="Email" name="contactEmail" type="email" defaultValue={settings?.contactEmail || ""} placeholder="Leave blank until Viola confirms an address" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="emailVerified" value="yes" defaultChecked={settings?.emailVerified} /> Show this email on the website</label>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social profiles</CardTitle>
              <CardDescription>A blank link is left off the website.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <thead><tr><Th>Network</Th><Th>Profile link</Th></tr></thead>
                <tbody>
                  <tr><Td>Instagram</Td><Td><Input name="instagramUrl" defaultValue={settings?.instagramUrl || brand.instagram} aria-label="Instagram" /></Td></tr>
                  <tr><Td>Facebook</Td><Td><Input name="facebookUrl" defaultValue={settings?.facebookUrl || brand.facebook} aria-label="Facebook" /></Td></tr>
                  <tr><Td>TikTok</Td><Td><Input name="tiktokUrl" defaultValue={settings?.tiktokUrl || brand.tiktok} aria-label="TikTok" /></Td></tr>
                </tbody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Homepage and about</CardTitle>
              <CardDescription>These words appear on the homepage, about page, and footer.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Hero title" name="heroTitle" defaultValue={settings?.heroTitle || brand.heroTitle} />
              <label className="text-sm font-semibold">Hero text<Textarea className="mt-2 font-normal" name="heroText" defaultValue={settings?.heroText || brand.heroText} /></label>
              <Field label="About title" name="aboutTitle" defaultValue={settings?.aboutTitle || brand.aboutTitle} />
              <label className="text-sm font-semibold">About text<Textarea className="mt-2 font-normal" name="aboutText" defaultValue={settings?.aboutText || brand.aboutText} /></label>
              <label className="text-sm font-semibold">Footer description<Textarea className="mt-2 font-normal" name="footerText" defaultValue={settings?.footerText || brand.footerText} /></label>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end xl:col-span-2"><Button type="submit">Save public details</Button></div>
      </form>

      <form action={saveStudioHours}>
        <Card>
          <CardHeader>
            <CardTitle>Studio hours</CardTitle>
            <CardDescription>The contact page groups days that share the same hours. Open days must use {interval === 30 ? "hour or half-hour" : "whole-hour"} times because these hours also build the booking calendar.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead><tr><Th>Day</Th><Th>Open</Th><Th>Opens</Th><Th>Closes</Th><Th>Shown now</Th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.day}>
                    <Td className="font-semibold">{row.day}</Td>
                    <Td><input name={`isOpen_${row.dayOfWeek}`} type="checkbox" defaultChecked={row.open} aria-label={`${row.day} is open`} /></Td>
                    <Td><Input name={`openingTime_${row.dayOfWeek}`} type="time" step={interval * 60} defaultValue={row.openingTime} aria-label={`${row.day} opening time`} /></Td>
                    <Td><Input name={`closingTime_${row.dayOfWeek}`} type="time" step={interval * 60} defaultValue={row.closingTime} aria-label={`${row.day} closing time`} /></Td>
                    <Td>{row.label}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-4 flex justify-end"><Button type="submit">Save studio hours</Button></div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text" }: { label: string; name: string; defaultValue: string; placeholder?: string; type?: string }) {
  return <label className="text-sm font-semibold">{label}<Input className="mt-2 font-normal" name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} /></label>;
}
