import { savePaymentProof } from "@/lib/upload";
import { apiError } from "@/lib/api-error";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const settings = await securitySettings();
    await consumeRateLimit({ action: "proof-upload", identifier: getRequestIp(request.headers), limit: settings.uploadMax, windowSeconds: settings.uploadWindowSeconds });
    const formData = await request.formData();
    const file = formData.get("file");
    const bookingCode = String(formData.get("bookingCode") || "pending");

    if (!(file instanceof File)) {
      return Response.json({ error: "Payment proof file is required.", code: "PROOF_REQUIRED" }, { status: 400 });
    }

    const screenshotPath = await savePaymentProof(file, bookingCode);
    return Response.json({ screenshotPath });
  } catch (error) {
    return apiError(error, "The payment proof could not be uploaded. Please try again.");
  }
}
