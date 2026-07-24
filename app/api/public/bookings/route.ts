import { apiError } from "@/lib/api-error";
import { PublicBookingError, createPublicBookingRecord } from "@/lib/public-booking";

export async function POST(request: Request) {
  try {
    const booking = await createPublicBookingRecord(await request.formData(), request.headers);
    return Response.json(booking, { status: booking.recovered ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PublicBookingError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    return apiError(error, "Your booking could not be completed. Please use booking recovery before trying again.");
  }
}
