import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { readPaymentProof } from "@/lib/payment-proof";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("VIEW_COURSE_PAYMENTS");
  const payment = await prisma.coursePayment.findUnique({ where: { id: (await params).id } });
  if (!payment?.proofPath) return new Response("Not found", { status: 404 });
  const proof = await readPaymentProof(payment.proofPath);
  return new Response(new Uint8Array(proof.file), {
    headers: {
      "Content-Type": proof.contentType,
      "Content-Disposition": `inline; filename="${proof.fileName.replace(/[\r\n"\\]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
