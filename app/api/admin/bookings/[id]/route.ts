import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
      service: true,
      payment: {
        select: {
          id: true,
          bookingId: true,
          requiredAdvanceAmount: true,
          paidAmount: true,
          paymentStatus: true,
          paymentMethod: true,
          bankAccountId: true,
          verifiedByUserId: true,
          verifiedAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          bankAccount: true,
        },
      },
      bookedBy: true,
      confirmedBy: true,
    },
  });

  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  return Response.json(booking);
}
