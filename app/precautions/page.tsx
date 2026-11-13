import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Download, ExternalLink, FileText } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = pageMetadata({
  title: "Pre-Procedure Precautions",
  description: "Read Viola Brows and Beauty preparation and safety precautions before your appointment, and download the current client document.",
  path: "/precautions",
});

export default function PrecautionsPage() {
  return (
    <PublicShell><main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="mb-7"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Before your appointment</p><h1 className="font-display text-4xl font-bold">Client precautions</h1><p className="mt-2 max-w-3xl leading-7 text-muted-foreground">Read the general guidance and the section for your booked service. Contact Viola before payment when a warning condition applies.</p></div>
      <Card><CardContent className="p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><FileText className="h-6 w-6 shrink-0 text-primary" /><div className="min-w-0"><p className="break-words font-bold">Client Pre-Procedure Precautions</p><p className="text-sm text-muted-foreground">Open the client document before your appointment.</p></div></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/api/public/precautions/current" target="_blank"><ExternalLink className="h-4 w-4" />Open PDF</Link></Button><Button asChild><Link href="/api/public/precautions/current?download=1"><Download className="h-4 w-4" />Download PDF</Link></Button></div></div></CardContent></Card>
    </main></PublicShell>
  );
}
