import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_SERVICES");
  const { id } = await params;
  const document = await prisma.precautionDocument.findUnique({ where: { id } });
  if (!document) return Response.json({ error: "Document not found" }, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  const safeName = document.fileName.replace(/[\r\n"\\]/g, "_");

  return new Response(document.fileData, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
