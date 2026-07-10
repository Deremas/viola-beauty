import { getSlotAvailability } from "@/lib/booking-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!serviceId || !date) {
    return Response.json({ error: "serviceId and date are required" }, { status: 400 });
  }

  const slots = await getSlotAvailability(serviceId, date);
  return Response.json({ slots: slots.filter((slot) => slot.isAvailable) });
}
