"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, Menu, Search, X } from "lucide-react";
import { BrandMark } from "@/components/public/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Services" },
  { href: "/courses", label: "Courses" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const statusCurrent = isCurrent(pathname, "/booking-status");

  return (
    <header className="sticky top-0 z-50 border-b border-brand-line bg-[#F4E4EE]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:gap-3 sm:px-6">
        <Link href="/" aria-label="Viola Brows and Beauty home" aria-current={pathname === "/" ? "page" : undefined} className="min-w-0 shrink rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" onClick={() => setOpen(false)}>
          <BrandMark compact />
        </Link>
        <nav className="hidden min-w-0 items-center gap-4 xl:flex 2xl:gap-6" aria-label="Primary">
          {links.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined} className={cn("nav-link text-sm font-semibold transition-colors duration-150 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand", current ? "text-brand" : "text-brand-plum")}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm" className={cn("hidden sm:inline-flex", statusCurrent && "border-brand bg-white text-brand")}>
            <Link href="/booking-status" aria-current={statusCurrent ? "page" : undefined}><Search className="h-4 w-4" />Booking status</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/book"><CalendarPlus className="h-4 w-4" /><span className="sm:hidden">Book</span><span className="hidden sm:inline">Book a Service</span></Link>
          </Button>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-brand-line xl:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-brand-line bg-[#F4E4EE] px-4 py-3 xl:hidden" aria-label="Mobile">
          <div className="grid gap-1">
            {[{ href: "/", label: "Home" }, ...links, { href: "/booking-status", label: "Booking status" }, { href: "/precautions", label: "Precautions" }].map((link) => {
              const current = isCurrent(pathname, link.href);
              const hiddenOnDesktopStatus = link.href === "/booking-status" ? "sm:hidden" : "";
              return (
                <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined} className={cn("rounded-md px-3 py-3 text-sm font-semibold hover:bg-white", hiddenOnDesktopStatus, current ? "bg-white text-brand" : "text-brand-plum")} onClick={() => setOpen(false)}>{link.label}</Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
