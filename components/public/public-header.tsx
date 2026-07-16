import Link from "next/link";
import { CalendarPlus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="Viola Brows and Beauty home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-lg font-bold leading-tight">Viola</span>
            <span className="block text-xs text-muted-foreground">Brows and Beauty</span>
          </span>
        </Link>

        <nav className="flex items-center justify-end gap-2" aria-label="Client navigation">
          <Button asChild variant="outline" size="sm">
            <Link href="/booking-status">
              <Search className="h-4 w-4" />
              <span className="sm:hidden">Check status</span>
              <span className="hidden sm:inline">Check booking status</span>
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/book">
              <CalendarPlus className="h-4 w-4" />
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book appointment</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
