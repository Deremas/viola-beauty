import { prisma } from "@/lib/prisma";
import { isDbError } from "@/lib/db-errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let image;
  try {
    image = await prisma.serviceImage.findUnique({ where: { serviceId: id } });
  } catch (error) {
    if (isDbError(error)) return new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    throw error;
  }
  if (!image) return new Response("Image not found", { status: 404 });

  return new Response(new Uint8Array(image.fileData), {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.fileSize),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
