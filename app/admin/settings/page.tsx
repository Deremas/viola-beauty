import Link from "next/link";
import { CalendarClock, FileText, Landmark, MessageSquareText, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { PermissionKey } from "@prisma/client";
import { hasPermission, requireUser } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";

const settings = [
  { href: "/admin/settings/services", label: "Services", description: "Prices, advance amounts, service duration, and client visibility.", icon: Sparkles, permission: "MANAGE_SERVICES" },
  { href: "/admin/settings/precautions", label: "Client precautions", description: "Upload the full PDF, view version history, and choose the current client document.", icon: FileText, permission: "MANAGE_SERVICES" },
  { href: "/admin/settings/bank-accounts", label: "Bank accounts", description: "Payment accounts and instructions shown during booking.", icon: Landmark, permission: "MANAGE_BANK_ACCOUNTS" },
  { href: "/admin/settings/availability", label: "Availability", description: "Working hours and breaks between available times.", icon: CalendarClock, permission: "MANAGE_AVAILABILITY" },
  { href: "/admin/settings/days-off", label: "Days off", description: "Full and partial days when appointments are unavailable.", icon: CalendarClock, permission: "MANAGE_AVAILABILITY" },
  { href: "/admin/settings/users", label: "Staff users", description: "Logins, passwords, activation, and role assignment.", icon: Users, permission: "MANAGE_STAFF" },
  { href: "/admin/settings/receptionists", label: "Receptionists", description: "Receptionist accounts, logins, status, and assigned roles.", icon: Users, permission: "MANAGE_STAFF" },
  { href: "/admin/settings/roles", label: "Staff roles", description: "Create roles from the complete permission list.", icon: ShieldCheck, permission: "MANAGE_ROLES" },
  { href: "/admin/settings/telegram", label: "Telegram alerts", description: "Recipients and notification preferences.", icon: Send, permission: "MANAGE_NOTIFICATIONS" },
  { href: "/admin/settings/sms", label: "SMS confirmation", description: "Send booking confirmation texts to clients.", icon: MessageSquareText, permission: "MANAGE_NOTIFICATIONS" },
  { href: "/admin/settings/security", label: "Security limits", description: "Rate limits for login, booking, uploads, slots, and status checks.", icon: ShieldCheck, permission: "MANAGE_ROLES", adminOnly: true },
];

export default async function SettingsPage() {
  const user = await requireUser();
  const visible = settings.filter((item) => (!("adminOnly" in item) || !item.adminOnly || user.role === "ADMIN") && hasPermission(user, item.permission as PermissionKey));
  return <div className="space-y-6"><div><h1 className="font-display text-3xl font-bold">Settings</h1><p className="text-sm text-muted-foreground">Manage every configurable part of the Viola booking system.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <Link key={item.href} href={item.href} className="group"><Card className="h-full transition-transform group-hover:-translate-y-1"><CardContent className="p-5"><item.icon className="mb-4 h-6 w-6 text-primary" /><h2 className="text-lg font-semibold">{item.label}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></CardContent></Card></Link>)}</div>{visible.length === 0 ? <p className="rounded-lg border bg-white p-5 text-muted-foreground">Your role does not include access to system settings.</p> : null}</div>;
}
