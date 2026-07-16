import Link from "next/link";
import { Banknote, CalendarDays, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut, MessageSquareText, Send, Settings, Sparkles, Users } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: Banknote },
  { href: "/admin/settings/services", label: "Settings", icon: Settings },
  { href: "/admin/settings/telegram", label: "Telegram alerts", icon: Send },
  { href: "/admin/settings/sms", label: "SMS alerts", icon: MessageSquareText },
];

export default function AdminSidebar() {
  return (
    <>
      <AdminMobileMenu logoutAction={logout} />

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
          {nav.map((item) => (
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
