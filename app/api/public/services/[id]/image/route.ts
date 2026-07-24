import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.serviceImage.findUnique({ where: { serviceId: id } });
  if (!image) return new Response("Image not found", { status: 404 });

  return new Response(new Uint8Array(image.fileData), {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.fileSize),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
