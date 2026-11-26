import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      include: { image: { select: { id: true } } },
      orderBy: { name: "asc" },
    });

    return Response.json(services.map(({ image, ...service }) => ({
      ...service,
      hasImage: Boolean(image),
    })));
  } catch (error) {
    return apiError(error, "Services are temporarily unavailable.");
  }
}
