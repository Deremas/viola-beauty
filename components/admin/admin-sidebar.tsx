import Link from "next/link";
import { Banknote, CalendarDays, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut, MessageSquareText, Send, Settings, Sparkles, Users } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import { Button } from "@/components/ui/button";
import { hasPermission, type SessionUser } from "@/lib/permissions";
import type { PermissionKey } from "@prisma/client";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "VIEW_DASHBOARD" },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays, permission: "VIEW_CALENDAR" },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList, permission: "VIEW_BOOKINGS" },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck, permission: "MANAGE_TASKS" },
  { href: "/admin/clients", label: "Customers", icon: Users, permission: "VIEW_CLIENTS" },
  { href: "/admin/payments", label: "Payments", icon: Banknote, permission: "VIEW_PAYMENTS" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "MANAGE_SERVICES" },
  { href: "/admin/settings/telegram", label: "Telegram alerts", icon: Send, permission: "MANAGE_NOTIFICATIONS" },
  { href: "/admin/settings/sms", label: "SMS alerts", icon: MessageSquareText, permission: "MANAGE_NOTIFICATIONS" },
];

export default function AdminSidebar({ user }: { user: SessionUser }) {
  const settingsPermissions: PermissionKey[] = [
    "MANAGE_SERVICES",
    "MANAGE_BANK_ACCOUNTS",
    "MANAGE_AVAILABILITY",
    "MANAGE_STAFF",
    "MANAGE_ROLES",
    "MANAGE_NOTIFICATIONS",
  ];
  const visibleNav = nav.filter((item) =>
    item.href === "/admin/settings"
      ? settingsPermissions.some((permission) => hasPermission(user, permission))
      : hasPermission(user, item.permission as PermissionKey),
  );
  return (
    <>
      <AdminMobileMenu logoutAction={logout} items={visibleNav.map(({ href, label }) => ({ href, label }))} />

      <aside className="sticky top-0 hidden h-screen w-64 overflow-y-auto border-r bg-white/80 p-5 lg:block">
        <Link href="/admin/dashboard" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-xl font-bold">Viola</span>
            <span className="text-xs text-muted-foreground">Booking System</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <form action={logout} className="pt-4">
            <Button className="justify-start text-destructive hover:bg-destructive/10" variant="ghost" type="submit" pendingText="Signing out...">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </nav>
      </aside>
    </>
  );
}
