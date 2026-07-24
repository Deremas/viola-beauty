import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { createStaffBooking } from "./actions";
import { BookingSlotPicker } from "@/components/booking/booking-slot-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function CreateBookingPage() {
  await requirePermission("CREATE_BOOKINGS");
  const [services, bankAccounts] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.bankAccount.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { bankName: "asc" } }),
  ]);

  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle>Create booking</CardTitle></CardHeader>
      <CardContent>
        <form action={createStaffBooking} className="grid gap-4">
          <BookingSlotPicker
            services={services.map((service) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: Number(service.price),
              advanceAmount: Number(service.advanceAmount),
              durationMinutes: service.durationMinutes,
              bufferMinutes: service.bufferMinutes,
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="fullName">Client name</Label><Input id="fullName" name="fullName" required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment review</Label>
            <Select id="paymentStatus" name="paymentStatus" defaultValue="PROOF_UPLOADED" required>
              <option value="PROOF_UPLOADED">Send proof for review</option>
              <option value="ADVANCE_CONFIRMED">Advance already verified by staff</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountId">Bank account used</Label>
            <Select id="bankAccountId" name="bankAccountId" required>
              <option value="">Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} - {account.accountNumber}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentProof">Payment proof</Label>
            <Input id="paymentProof" name="paymentProof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
            <p className="text-xs text-muted-foreground">Required. Upload a clear JPG, PNG, WEBP, or PDF up to 5 MB.</p>
          </div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Every booking requires advance payment proof. If a client misses a confirmed appointment, mark it as a no-show after the appointment time. The booking will expire and its advance cannot be refunded or moved to another booking.
          </div>
          <Button type="submit">Create staff booking</Button>
        </form>
      </CardContent>
    </Card>
  );
}
