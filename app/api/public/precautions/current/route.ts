import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const document = await prisma.precautionDocument.findFirst({ where: { isActive: true }, orderBy: { activatedAt: "desc" } });
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
