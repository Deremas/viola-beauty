import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client Pre-Procedure Precautions", description: "Read and download Viola Brows and Beauty preparation and safety precautions before your appointment." };

export default async function PrecautionsPage() {
  const current = await prisma.precautionDocument.findFirst({ where: { isActive: true }, select: { title: true, fileName: true }, orderBy: { activatedAt: "desc" } });
  return (
    <><PublicHeader /><main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="mb-7"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Before your appointment</p><h1 className="font-display text-4xl font-bold">Client precautions</h1><p className="mt-2 max-w-3xl leading-7 text-muted-foreground">Read the general guidance and the section for your booked service. Contact Viola before payment when a warning condition applies.</p></div>
      {current ? <Card><CardContent className="p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><FileText className="h-6 w-6 text-primary" /><div><p className="font-bold">{current.title}</p><p className="text-sm text-muted-foreground">{current.fileName}</p></div></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/api/public/precautions/current" target="_blank"><ExternalLink className="h-4 w-4" />Open PDF</Link></Button><Button asChild><Link href="/api/public/precautions/current?download=1"><Download className="h-4 w-4" />Download PDF</Link></Button></div></div><iframe title="Client pre-procedure precautions" src="/api/public/precautions/current" className="h-[72vh] w-full rounded-lg border bg-white" /></CardContent></Card> : <p className="rounded-xl border bg-white p-6 text-muted-foreground">The full precaution document is being updated. Please contact Viola before your appointment.</p>}
    </main></>
  );
}
