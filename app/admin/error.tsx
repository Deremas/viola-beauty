"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-7 shadow-soft"><AlertTriangle className="h-8 w-8 text-destructive" /><h1 className="mt-5 font-display text-3xl font-bold">This screen could not load its records.</h1><p className="mt-3 leading-7 text-muted-foreground">Nothing was saved. Try again, or open another page. A form problem stays on the form and names the field.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><Button asChild variant="outline"><Link href="/admin/dashboard">Dashboard</Link></Button><Button type="button" onClick={reset}>Try again</Button></div></div>;
}
