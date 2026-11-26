import { prisma } from "@/lib/prisma";
import { isDbError } from "@/lib/db-errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; side: string }> }) {
  const { id, side } = await params;
  if (side !== "before" && side !== "after") return new Response("Not found", { status: 404 });
  let item;
  try {
    item = await prisma.galleryAsset.findUnique({ where: { id } });
  } catch (error) {
    if (isDbError(error)) return new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    throw error;
  }
  if (!item || item.publicationStatus !== "PUBLISHED") return new Response("Not found", { status: 404 });
  if (item.kind === "RESULT" && (!item.consentRecorded || !item.beforeData || !item.afterData)) return new Response("Not found", { status: 404 });
  const data = side === "before" ? item.beforeData : item.afterData;
  const type = side === "before" ? item.beforeType : item.afterType;
  if (!data || !type) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
