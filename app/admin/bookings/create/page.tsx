import { prisma } from "@/lib/prisma";
import { createStaffBooking } from "./actions";
import { BookingSlotPicker } from "@/components/booking/booking-slot-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function CreateBookingPage() {
  const [services, bankAccounts] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: { bankName: "asc" } }),
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
          <Select name="paymentStatus" defaultValue="NOT_PAID">
            <option value="NOT_PAID">Not paid</option>
            <option value="PROOF_UPLOADED">Proof uploaded</option>
            <option value="ADVANCE_CONFIRMED">Advance confirmed</option>
          </Select>
          <Select name="bankAccountId">
            <option value="">Bank account used optional</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} - {account.accountNumber}
              </option>
            ))}
          </Select>
          <div className="space-y-2">
            <Label htmlFor="paymentProof">Payment proof optional</Label>
            <Input id="paymentProof" name="paymentProof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
          </div>
          <Button type="submit">Create staff booking</Button>
        </form>
      </CardContent>
    </Card>
  );
}
