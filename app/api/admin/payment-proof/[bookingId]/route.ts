import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { readPaymentProof } from "@/lib/payment-proof";

export async function GET(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  await requireUser();
  const { bookingId } = await params;
  const payment = await prisma.payment.findUnique({ where: { bookingId } });

  if (!payment?.screenshotPath) {
    return Response.json({ error: "Payment proof not found" }, { status: 404 });
  }

  try {
    const proof = await readPaymentProof(payment.screenshotPath);
    const safeFileName = proof.fileName.replace(/[\r\n"\\]/g, "_");
    return new Response(proof.file, {
      headers: {
        "Content-Type": proof.contentType,
        "Content-Disposition": `inline; filename="${safeFileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid payment proof path") {
      return Response.json({ error: "Invalid payment proof path" }, { status: 400 });
    }

    return Response.json({ error: "Payment proof is not available" }, { status: 404 });
  }
}
