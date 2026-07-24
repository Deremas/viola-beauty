import { z } from "zod";

export const publicBookingSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  note: z.string().optional(),
  bankAccountId: z.string().min(1),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  advanceAmount: z.coerce.number().nonnegative(),
  durationMinutes: z.coerce.number().int().positive(),
  bufferMinutes: z.coerce.number().int().nonnegative(),
  bookingWarningTitle: z.string().optional(),
  bookingWarningIntro: z.string().optional(),
  bookingWarningInstructions: z.string().optional(),
  bookingWarningContact: z.string().optional(),
  bookingWarningActive: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(false),
});
