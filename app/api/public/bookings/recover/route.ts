import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { getRequestIp, securityHash } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = String(body?.submissionToken || "").trim();
    const phone = normalizeEthiopianPhone(String(body?.phone || ""));
    if (token.length < 24 || !phone) {
      return Response.json({ state: "NOT_FOUND" }, { headers: { "Cache-Control": "no-store" } });
    }
    const settings = await securitySettings();
    await consumeRateLimit({ action: "booking-recovery", identifier: getRequestIp(request.headers), limit: settings.statusMax, windowSeconds: settings.statusWindowSeconds });

    const tokenHash = securityHash(`booking-token:${token}`);
    const phoneHash = securityHash(`booking-phone:${phone}`);
    const submission = await prisma.bookingSubmission.findFirst({
      where: { tokenHash, phoneHash },
      include: { booking: { select: { bookingCode: true } } },
    });
    if (!submission) return Response.json({ state: "NOT_FOUND" }, { headers: { "Cache-Control": "no-store" } });
    if (submission.status === "COMPLETED" && submission.booking) {
      return Response.json({ state: "BOOKING_FOUND", bookingCode: submission.booking.bookingCode }, { headers: { "Cache-Control": "no-store" } });
    }
    if (submission.status === "PROCESSING" && Date.now() - submission.lastAttemptedAt.getTime() < 120_000) {
      return Response.json({ state: "STILL_PROCESSING" }, { status: 202, headers: { "Retry-After": "3", "Cache-Control": "no-store" } });
    }
    if (submission.status === "PROCESSING") {
      await prisma.bookingSubmission.update({ where: { id: submission.id }, data: { status: "FAILED", lastErrorCode: "PROCESSING_TIMEOUT" } });
    }
    return Response.json({ state: "FAILED" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error, "We could not check the previous booking request. Please try again.");
  }
}
