import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center px-5"><div className="max-w-xl text-center"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">404</p><h1 className="mt-3 font-display text-4xl font-bold">This page could not be found.</h1><p className="mt-3 text-muted-foreground">The link may be old, or the requested record may no longer be available.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild variant="outline"><Link href="/booking-status">Check booking status</Link></Button><Button asChild><Link href="/">Return to Viola</Link></Button></div></div></main>;
}
