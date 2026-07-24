import { prisma } from "@/lib/prisma";

export async function getBookingSlotInterval() {
  const settings = await prisma.bookingSetting.findUnique({
    where: { id: "primary" },
    select: { slotIntervalMinutes: true },
  });

  return settings?.slotIntervalMinutes === 30 ? 30 : 60;
}
