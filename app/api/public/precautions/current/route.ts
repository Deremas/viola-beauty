import { prisma } from "@/lib/prisma";
import { isDbError } from "@/lib/db-errors";

export async function GET(request: Request) {
  let document;
  try {
    document = await prisma.precautionDocument.findFirst({ where: { isActive: true }, orderBy: { activatedAt: "desc" } });
  } catch (error) {
    if (isDbError(error)) return new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    throw error;
  }
  if (!document) return Response.json({ error: "Precaution document is not available" }, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  const safeName = document.fileName.replace(/[\r\n"\\]/g, "_");

  return new Response(document.fileData, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
