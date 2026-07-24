"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><div className="w-full max-w-xl rounded-2xl border bg-white p-7 shadow-soft"><AlertTriangle className="h-8 w-8 text-destructive" /><h1 className="mt-5 font-display text-3xl font-bold">Something did not load correctly.</h1><p className="mt-3 leading-7 text-muted-foreground">Please retry. If the problem continues, return to Viola and start from a safe page.</p>{error.digest ? <p className="mt-3 text-xs text-muted-foreground">Reference: {error.digest}</p> : null}<div className="mt-6 flex flex-wrap justify-end gap-3"><Button asChild variant="outline"><Link href="/">Return home</Link></Button><Button type="button" onClick={reset}>Try again</Button></div></div></main>;
}
