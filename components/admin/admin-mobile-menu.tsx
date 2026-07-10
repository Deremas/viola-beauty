"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Banknote, CalendarDays, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Users } from "lucide-react";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: Banknote },
  { href: "/admin/settings/services", label: "Settings", icon: Settings },
];

export function AdminMobileMenu({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    if (!open) return;
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative z-50 border-b bg-white/90 px-4 py-3 lg:hidden" ref={menuRef}>
      <div className="relative z-[70] flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 shadow-soft">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-xl font-bold">Viola</span>
            <span className="block truncate text-xs text-muted-foreground">Booking System</span>
          </span>
        </Link>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-white transition-colors aria-expanded:bg-primary"
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? <div className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-[1px]" /> : null}
      {open ? (
        <div className="fixed inset-x-4 top-24 z-50">
          <nav className="grid gap-2 rounded-xl border bg-white p-3 shadow-soft">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md border bg-background/80 px-3 py-3 text-sm font-semibold hover:bg-muted" onClick={() => setOpen(false)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-left text-sm font-semibold text-destructive hover:bg-destructive/10" type="submit">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
