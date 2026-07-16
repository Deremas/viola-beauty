import type { TelegramNotificationEvent } from "@prisma/client";

export const telegramEvents: Array<{
  value: TelegramNotificationEvent;
  label: string;
  description: string;
}> = [
  { value: "PAYMENT_PROOF_UPLOADED", label: "Payment proof uploaded", description: "A client or staff member sends a booking with payment proof." },
  { value: "PAYMENT_CONFIRMED", label: "Payment confirmed", description: "Staff verifies the advance and confirms the booking." },
  { value: "PAYMENT_REJECTED", label: "Payment rejected", description: "Staff rejects an uploaded payment proof." },
  { value: "BOOKING_RESCHEDULED", label: "Booking rescheduled", description: "An appointment is moved to a different date or time." },
  { value: "BOOKING_COMPLETED", label: "Booking completed", description: "Staff marks the service as completed." },
  { value: "BOOKING_CANCELLED", label: "Booking cancelled", description: "Staff cancels an appointment." },
  { value: "BOOKING_NO_SHOW", label: "Client did not arrive", description: "Staff marks the appointment as a no-show." },
];

export const telegramEventValues = telegramEvents.map((item) => item.value);
