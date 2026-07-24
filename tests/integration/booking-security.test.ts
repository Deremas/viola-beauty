import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test("booking submission token is unique and connects atomically to a payment booking", { skip: !testDatabaseUrl }, async () => {
  assert.ok(testDatabaseUrl);
  assert.notEqual(testDatabaseUrl, process.env.PRODUCTION_DATABASE_URL);
  const prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
  const suffix = crypto.randomUUID();
  const tokenHash = `integration-${suffix}`;
  const serviceId = `integration-service-${suffix}`;
  const bankId = `integration-bank-${suffix}`;
  let clientId = "";

  try {
    await prisma.service.create({ data: { id: serviceId, name: "Integration Service", price: 1000, advanceAmount: 300, durationMinutes: 60 } });
    await prisma.bankAccount.create({ data: { id: bankId, bankName: "Test Bank", accountName: "Test", accountNumber: suffix } });
    await prisma.bookingSubmission.create({ data: { tokenHash, phoneHash: `phone-${suffix}`, requestFingerprint: `fingerprint-${suffix}`, expiresAt: new Date(Date.now() + 60_000) } });

    const booking = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({ data: { fullName: "Integration Client", phone: `2519${suffix.replace(/\D/g, "").padEnd(8, "0").slice(0, 8)}` } });
      clientId = client.id;
      const created = await tx.booking.create({
        data: {
          bookingCode: `VB-TEST-${suffix}`,
          clientId: client.id,
          serviceId,
          startDateTime: new Date(Date.now() + 86_400_000),
          endDateTime: new Date(Date.now() + 90_000_000),
          status: "PAYMENT_UPLOADED",
          source: "ONLINE_CLIENT",
          payment: { create: { requiredAdvanceAmount: 300, paymentStatus: "PROOF_UPLOADED", bankAccountId: bankId, screenshotPath: "integration-proof" } },
        },
      });
      await tx.bookingSubmission.update({ where: { tokenHash }, data: { status: "COMPLETED", bookingId: created.id, completedAt: new Date() } });
      return created;
    });

    const recovered = await prisma.bookingSubmission.findUnique({ where: { tokenHash }, include: { booking: { include: { payment: true } } } });
    assert.equal(recovered?.bookingId, booking.id);
    assert.equal(recovered?.booking?.payment?.paymentStatus, "PROOF_UPLOADED");
    await assert.rejects(() => prisma.bookingSubmission.create({ data: { tokenHash, phoneHash: "other", requestFingerprint: "other", expiresAt: new Date(Date.now() + 60_000) } }));
  } finally {
    await prisma.bookingSubmission.deleteMany({ where: { tokenHash } });
    await prisma.payment.deleteMany({ where: { booking: { bookingCode: { startsWith: "VB-TEST-" } } } });
    await prisma.booking.deleteMany({ where: { bookingCode: { startsWith: "VB-TEST-" } } });
    if (clientId) await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.bankAccount.deleteMany({ where: { id: bankId } });
    await prisma.service.deleteMany({ where: { id: serviceId } });
    await prisma.$disconnect();
  }
});
