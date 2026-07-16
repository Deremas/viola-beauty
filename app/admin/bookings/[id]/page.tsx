import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { money, shortDateTime } from "@/lib/format";
import { formatFileSize, getPaymentProofInfo } from "@/lib/payment-proof";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Td, Th } from "@/components/ui/table";
import { PaymentProofViewer } from "@/components/admin/payment-proof-viewer";
import {
  cancelBooking,
  completeBooking,
  confirmPayment,
  markNoShow,
  recordAdditionalPayment,
  rejectPayment,
  rescheduleBooking,
} from "./actions";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("VIEW_BOOKINGS");
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
      service: true,
      payment: { include: { bankAccount: true, verifiedBy: true } },
      bookedBy: true,
      confirmedBy: true,
      cancelledBy: true,
      statusLogs: {
        include: { changedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!booking) notFound();

  const servicePrice = Number(booking.service.price);
  const paidAmount = Number(
    booking.payment?.paidAmount ||
      (booking.payment?.paymentStatus === "ADVANCE_CONFIRMED"
        ? booking.payment.requiredAdvanceAmount
        : 0),
  );
  const remainingBalance = Math.max(0, servicePrice - paidAmount);
  const paymentStatus = booking.payment?.paymentStatus;

  const paymentProof = booking.payment?.screenshotPath
    ? await getPaymentProofInfo(booking.payment.screenshotPath)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/bookings">
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} />
          {booking.payment ? (
            <StatusBadge status={booking.payment.paymentStatus} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{booking.bookingCode}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-2">
          <InfoTable
            title="Client"
            rows={[
              ["Name", booking.client.fullName],
              ["Phone", booking.client.phone],
              ["Email", booking.client.email || "Not provided"],
              ["Client note", booking.client.note || "No note"],
            ]}
          />
          <InfoTable
            title="Booking"
            rows={[
              ["Service", booking.service.name],
              ["Price", money(booking.service.price)],
              [
                "Service time",
                `${booking.service.durationMinutes} min service + ${booking.service.bufferMinutes} min gap between services`,
              ],
              ["Starts", shortDateTime(booking.startDateTime)],
              ["Ends", shortDateTime(booking.endDateTime)],
              ["Source", booking.source],
              ["Booked by", booking.bookedBy?.name || "Online Client"],
              ["Created", shortDateTime(booking.createdAt)],
              ["Booking note", booking.note || "No note"],
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <InfoTable
                rows={[
                  [
                    "Advance required",
                    booking.payment
                      ? money(booking.payment.requiredAdvanceAmount)
                      : "No payment record",
                  ],
                  [
                    "Paid amount",
                    paidAmount > 0
                      ? money(paidAmount)
                      : "Not recorded",
                  ],
                  ["Remaining balance", money(remainingBalance)],
                  ["Payment method", booking.payment?.paymentMethod || "Not recorded"],
                  [
                    "Bank account",
                    booking.payment?.bankAccount
                      ? `${booking.payment.bankAccount.bankName} - ${booking.payment.bankAccount.accountName} - ${booking.payment.bankAccount.accountNumber}`
                      : "Not selected",
                  ],
                  [
                    "Verified by",
                    booking.payment?.verifiedBy?.name || "Not verified",
                  ],
                  [
                    "Verified at",
                    booking.payment?.verifiedAt
                      ? shortDateTime(booking.payment.verifiedAt)
                      : "Not verified",
                  ],
                  [
                    "Rejection reason",
                    booking.payment?.rejectionReason || "None",
                  ],
                ]}
              />
              <PaymentProof
                bookingId={booking.id}
                bookingCode={booking.bookingCode}
                hasPath={Boolean(booking.payment?.screenshotPath)}
                proof={paymentProof}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Status</Th>
                    <Th>Changed at</Th>
                    <Th>Changed by</Th>
                    <Th>Note</Th>
                  </tr>
                </thead>
                <tbody>
                  {booking.statusLogs.map((log) => (
                    <tr key={log.id}>
                      <Td>
                        <StatusBadge status={log.newStatus} />
                      </Td>
                      <Td>{shortDateTime(log.createdAt)}</Td>
                      <Td>{log.changedBy?.name || "System"}</Td>
                      <Td>
                        {log.note ||
                          (log.oldStatus
                            ? `From ${log.oldStatus}`
                            : "Status set")}
                      </Td>
                    </tr>
                  ))}
                  {booking.statusLogs.length === 0 ? (
                    <tr>
                      <Td
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No status history yet.
                      </Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentStatus === "PROOF_UPLOADED" ? (
                <>
                  <form action={confirmPayment} className="grid gap-3">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <div className="space-y-2">
                      <Label htmlFor="paid-amount">Amount received</Label>
                      <Input
                        id="paid-amount"
                        name="paidAmount"
                        type="number"
                        min={Number(booking.payment?.requiredAdvanceAmount || 0)}
                        max={servicePrice}
                        step="0.01"
                        defaultValue={Number(booking.payment?.requiredAdvanceAmount || 0)}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter the amount shown on the payment proof. The full service price is {money(servicePrice)}.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment method</Label>
                      <select id="payment-method" name="paymentMethod" defaultValue="Bank transfer" className="h-10 w-full rounded-md border bg-background px-3 text-sm" required>
                        <option>Bank transfer</option>
                        <option>Cash</option>
                        <option>Card or mobile payment</option>
                      </select>
                    </div>
                    <Button type="submit" pendingText="Confirming payment...">
                      Confirm payment
                    </Button>
                  </form>
                  <form action={rejectPayment} className="grid gap-3 border-t pt-4">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <div className="space-y-2">
                      <Label htmlFor="reason">Rejection reason</Label>
                      <Input id="reason" name="reason" placeholder="Why was this payment rejected?" required />
                    </div>
                    <Button variant="destructive" type="submit" pendingText="Rejecting payment...">
                      Reject payment
                    </Button>
                  </form>
                </>
              ) : null}

              {paymentStatus === "ADVANCE_CONFIRMED" ? (
                <>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    Advance payment confirmed. The booking is confirmed and {money(remainingBalance)} remains to be paid.
                  </div>
                  <form action={recordAdditionalPayment} className="grid gap-3">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <div className="space-y-2">
                      <Label htmlFor="additional-amount">Additional amount received</Label>
                      <Input
                        id="additional-amount"
                        name="additionalAmount"
                        type="number"
                        min="0.01"
                        max={remainingBalance}
                        step="0.01"
                        defaultValue={remainingBalance}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additional-payment-method">Payment method</Label>
                      <select id="additional-payment-method" name="paymentMethod" defaultValue="Cash" className="h-10 w-full rounded-md border bg-background px-3 text-sm" required>
                        <option>Cash</option>
                        <option>Bank transfer</option>
                        <option>Card or mobile payment</option>
                      </select>
                    </div>
                    <Button type="submit" pendingText="Recording payment...">
                      Record additional payment
                    </Button>
                  </form>
                </>
              ) : null}

              {paymentStatus === "FULLY_PAID" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 font-medium text-emerald-900">
                  Full payment recorded. No balance remains.
                </div>
              ) : null}

              {paymentStatus === "PAYMENT_REJECTED" ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  Payment rejected: {booking.payment?.rejectionReason || "No reason recorded"}
                </div>
              ) : null}

              {!booking.payment ? (
                <p className="text-sm text-muted-foreground">No payment record is attached to this booking.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reschedule</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={rescheduleBooking}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="bookingId" value={booking.id} />
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New date</Label>
                  <Input
                    id="reschedule-date"
                    name="date"
                    type="date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">New time</Label>
                  <Input
                    id="reschedule-time"
                    name="time"
                    type="time"
                    required
                  />
                </div>
                <Button variant="outline" type="submit">
                  Reschedule booking
                </Button>
              </form>
              <p className="mt-3 text-sm text-muted-foreground">
                Checks working hours, days off, gaps, and existing bookings
                before saving.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {paymentStatus === "FULLY_PAID" ? (
                <ActionForm action={completeBooking} bookingId={booking.id} label="Mark completed" />
              ) : (
                <p className="w-full text-sm text-muted-foreground">
                  Record the full service payment before marking this booking completed.
                </p>
              )}
              <ActionForm
                action={markNoShow}
                bookingId={booking.id}
                label="Mark no-show"
              />
              <ActionForm
                action={cancelBooking}
                bookingId={booking.id}
                label="Cancel booking"
                destructive
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoTable
                rows={[
                  [
                    "Confirmed by",
                    booking.confirmedBy?.name || "Not confirmed",
                  ],
                  [
                    "Cancelled by",
                    booking.cancelledBy?.name || "Not cancelled",
                  ],
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoTable({
  title,
  rows,
}: {
  title?: string;
  rows: Array<[string, ReactNode]>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      {title ? (
        <div className="border-b bg-background px-3 py-2 font-semibold">
          {title}
        </div>
      ) : null}
      <Table>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <Td className="w-44 bg-background/60 text-muted-foreground">
                {label}
              </Td>
              <Td className="font-medium">{value}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function PaymentProof({
  bookingId,
  bookingCode,
  hasPath,
  proof,
}: {
  bookingId: string;
  bookingCode: string;
  hasPath: boolean;
  proof: Awaited<ReturnType<typeof getPaymentProofInfo>> | null;
}) {
  if (!hasPath) {
    return (
      <div className="rounded-lg border bg-background/70 p-3 text-sm font-medium">
        Payment proof: No upload
      </div>
    );
  }

  if (!proof?.exists) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Payment proof record exists, but the file is missing from storage.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Payment proof</p>
          <p className="text-sm text-muted-foreground">
            {proof.fileName} - {proof.contentType} -{" "}
            {formatFileSize(proof.sizeBytes)}
          </p>
        </div>
        {!proof.isImage ? (
          <Link
            className="font-semibold text-primary"
            href={`/api/admin/payment-proof/${bookingId}`}
            target="_blank"
          >
            Open payment proof
          </Link>
        ) : null}
      </div>
      {proof.isImage ? (
        <PaymentProofViewer
          src={`/api/admin/payment-proof/${bookingId}`}
          alt={`Payment proof for ${bookingCode}`}
        />
      ) : null}
    </div>
  );
}

function ActionForm({
  action,
  bookingId,
  label,
  destructive,
}: {
  action: (formData: FormData) => Promise<void>;
  bookingId: string;
  label: string;
  destructive?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button variant={destructive ? "destructive" : "outline"} type="submit">
        {label}
      </Button>
    </form>
  );
}
