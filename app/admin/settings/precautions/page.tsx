import Link from "next/link";
import { Download, ExternalLink, FileText, History, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { shortDateTime } from "@/lib/format";
import { formatFileSize } from "@/lib/payment-proof";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/lib/status";
import { activatePrecautionDocument, uploadPrecautionDocument } from "./actions";

export default async function PrecautionsSettingsPage() {
  await requirePermission("MANAGE_SERVICES");
  const documents = await prisma.precautionDocument.findMany({
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const current = documents.find((document) => document.isActive);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="font-display text-3xl font-bold">Client precautions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload the full PDF, keep every previous version, and choose which version clients can open.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Upload new PDF</CardTitle></CardHeader>
          <CardContent>
            <form action={uploadPrecautionDocument} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="precaution-title">Document title</Label>
                <Input id="precaution-title" name="title" defaultValue="Client Pre-Procedure Precautions" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precaution-document">PDF document</Label>
                <Input id="precaution-document" name="document" type="file" accept="application/pdf,.pdf" required />
                <p className="text-xs leading-5 text-muted-foreground">Required. PDF only, up to 15 MB. Clicking upload without choosing a file never removes or replaces the current document.</p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" pendingText="Uploading PDF..."><Upload className="h-4 w-4" />Upload and make current</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current client document</CardTitle></CardHeader>
          <CardContent>
            {current ? (
              <div className="rounded-xl border bg-muted/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold">{current.title}</p><p className="mt-1 text-sm text-muted-foreground">{current.fileName} - {formatFileSize(current.fileSize)}</p></div>
                  <StatusBadge status="ACTIVE" />
                </div>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button asChild variant="outline"><Link href={`/api/admin/precautions/${current.id}`} target="_blank"><ExternalLink className="h-4 w-4" />Open in browser</Link></Button>
                  <Button asChild><Link href={`/api/admin/precautions/${current.id}?download=1`}><Download className="h-4 w-4" />Download PDF</Link></Button>
                </div>
              </div>
            ) : <p className="rounded-lg border bg-muted/40 p-5 text-muted-foreground">No precaution PDF has been uploaded yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><History className="h-5 w-5" />Version history</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0"><p className="font-semibold">{document.title}</p><p className="truncate text-sm text-muted-foreground">{document.fileName} - {formatFileSize(document.fileSize)}</p><p className="mt-1 text-xs text-muted-foreground">Uploaded {shortDateTime(document.createdAt)} by {document.uploadedBy?.name || "System"}</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {document.isActive ? <StatusBadge status="ACTIVE" /> : (
                  <form action={activatePrecautionDocument}><input type="hidden" name="id" value={document.id} /><Button type="submit" variant="outline" pendingText="Making current...">Make current</Button></form>
                )}
                <Button asChild variant="outline" size="icon" title="Open PDF"><Link href={`/api/admin/precautions/${document.id}`} target="_blank" aria-label={`Open ${document.fileName}`}><ExternalLink className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" size="icon" title="Download PDF"><Link href={`/api/admin/precautions/${document.id}?download=1`} aria-label={`Download ${document.fileName}`}><Download className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          ))}
          {documents.length === 0 ? <p className="text-sm text-muted-foreground">Uploaded versions will appear here and are never removed when a new version is added.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
