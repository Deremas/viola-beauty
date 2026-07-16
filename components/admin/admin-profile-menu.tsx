"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { SessionUser } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export function AdminProfileMenu({
  user,
  timezone,
  logoutAction,
}: {
  user: SessionUser;
  timezone: string;
  logoutAction: () => Promise<void>;
}) {
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
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-soft"
        type="button"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
          <UserCircle className="h-5 w-5" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-semibold">{user.name || "Staff"}</span>
          <span className="block text-xs text-muted-foreground">{user.role}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Signed in as</p>
          <p className="mt-1 font-semibold">{user.name || "Staff"}</p>
          <p className="text-sm text-muted-foreground">{user.role}</p>
          <div className="mt-4 rounded-md bg-background p-3 text-sm text-muted-foreground">
            {timezone} timezone display
          </div>
          <form action={logoutAction} className="mt-4">
            <Button className="w-full" variant="destructive" type="submit" pendingText="Signing out...">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
