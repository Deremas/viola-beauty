"use client";

import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-[80vh] items-center justify-center px-5 py-12"><div className="w-full max-w-2xl rounded-2xl border bg-white p-7 shadow-soft"><AlertTriangle className="h-8 w-8 text-primary" /><h1 className="mt-5 font-display text-3xl font-bold">Online booking is resting for a moment.</h1><p className="mt-3 leading-7 text-muted-foreground">Do not send another payment yet. Check booking status with your code and phone, or call the studio. The public pages stay open.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><Button asChild variant="outline"><Link href="/booking-status"><Search className="h-4 w-4" />Check existing booking</Link></Button><Button asChild variant="outline"><Link href="/book">Recover booking request</Link></Button><Button type="button" onClick={reset}>Try this page again</Button></div></div></main>;
}
