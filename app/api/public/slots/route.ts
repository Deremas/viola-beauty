import { getPublicAvailabilityNotice, getSlotAvailability } from "@/lib/booking-engine";
import { apiError } from "@/lib/api-error";
import { consumeRateLimit, securitySettings } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const settings = await securitySettings();
    await consumeRateLimit({ action: "public-slots", identifier: getRequestIp(request.headers), limit: settings.slotsMax, windowSeconds: settings.slotsWindowSeconds });
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!serviceId || !date) {
      return Response.json({ error: "Service and date are required.", code: "INVALID_SLOT_REQUEST" }, { status: 400 });
    }

    const [slots, notice] = await Promise.all([
      getSlotAvailability(serviceId, date),
      getPublicAvailabilityNotice(date),
    ]);
    return Response.json({ slots: slots.filter((slot) => slot.isAvailable), notice });
  } catch (error) {
    return apiError(error, "Available times could not be loaded. Please try again.");
  }
}
