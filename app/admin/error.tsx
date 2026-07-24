"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-7 shadow-soft"><AlertTriangle className="h-8 w-8 text-destructive" /><h1 className="mt-5 font-display text-3xl font-bold">This admin page could not be loaded.</h1><p className="mt-3 leading-7 text-muted-foreground">No change should be repeated until you verify the current booking or payment state.</p>{error.digest ? <p className="mt-3 text-xs text-muted-foreground">Reference: {error.digest}</p> : null}<div className="mt-6 flex flex-wrap justify-end gap-3"><Button asChild variant="outline"><Link href="/admin/dashboard">Dashboard</Link></Button><Button type="button" onClick={reset}>Try again</Button></div></div>;
}
