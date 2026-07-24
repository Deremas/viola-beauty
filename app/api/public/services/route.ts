import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true, deletedAt: null },
    include: { image: { select: { id: true } } },
    orderBy: { name: "asc" },
  });

  return Response.json(services.map(({ image, ...service }) => ({
    ...service,
    hasImage: Boolean(image),
  })));
}
