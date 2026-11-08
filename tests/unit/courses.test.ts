import test from "node:test";
import assert from "node:assert/strict";
import { applyOverdue, netCents, parseMoneyToCents, summarizeLedger } from "../../lib/courses/money";
import { assertClassTransition, assertRegistrationTransition, canBulkStart, intakeKey, WorkflowError } from "../../lib/courses/transitions";
import { buildCourseReport } from "../../lib/courses/report";
import { formatEthiopianPhone } from "../../lib/phone";

test("parses money in cents without floating point", () => {
  assert.equal(parseMoneyToCents("1500.50"), 150050);
  assert.equal(parseMoneyToCents("0.5"), 50);
  assert.equal(parseMoneyToCents("10.999"), null);
  assert.equal(netCents(10000, 2500), 7500);
});

test("calculates payment standing from verified ledger rows only", () => {
  const summary = summarizeLedger([
    { amountCents: 5000, type: "PAYMENT", status: "VERIFIED" },
    { amountCents: 1000, type: "PAYMENT", status: "PENDING" },
    { amountCents: 2000, type: "REFUND", status: "VERIFIED" },
  ], 10000);
  assert.equal(summary.verifiedNetCents, 3000);
  assert.equal(summary.outstandingCents, 7000);
  assert.equal(summary.standing, "PARTIALLY_PAID");
  assert.equal(applyOverdue(summary.standing, true), "OVERDUE");
  assert.equal(applyOverdue("PAID", true), "PAID");
});

test("registration and class transitions stay separate", () => {
  assert.doesNotThrow(() => assertRegistrationTransition("PENDING", "APPROVED"));
  assert.throws(() => assertRegistrationTransition("PENDING", "CONFIRMED"), WorkflowError);
  assert.doesNotThrow(() => assertClassTransition("SCHEDULED", "STARTED"));
  assert.throws(() => assertClassTransition("NOT_SCHEDULED", "FINISHED"), WorkflowError);
  assert.equal(intakeKey("  Oct   23 Batch "), "oct 23 batch");
});

test("bulk start only includes confirmed classes that have not started", () => {
  assert.equal(canBulkStart({ registrationStatus: "CONFIRMED", classProgress: "SCHEDULED" }), true);
  assert.equal(canBulkStart({ registrationStatus: "APPROVED", classProgress: "SCHEDULED" }), false);
  assert.equal(canBulkStart({ registrationStatus: "CONFIRMED", classProgress: "STARTED" }), false);
  assert.equal(canBulkStart({ registrationStatus: "CONFIRMED", classProgress: "FINISHED" }), false);
});

test("course report totals verified money and ignores pending proofs", () => {
  const report = buildCourseReport([
    {
      courseId: "brows",
      courseName: "Brows",
      registrationStatus: "CONFIRMED",
      classProgress: "SCHEDULED",
      expectedStartDate: null,
      agreedFee: "100.00",
      approvedDiscount: "0.00",
      payments: [
        { amountCents: 4000, type: "PAYMENT", status: "VERIFIED" },
        { amountCents: 9000, type: "PAYMENT", status: "PENDING" },
        { amountCents: 1000, type: "REFUND", status: "VERIFIED" },
      ],
    },
  ]);
  assert.equal(report.registrations, 1);
  assert.equal(report.verifiedRevenueCents, 3000);
  assert.equal(report.refundCents, 1000);
  assert.equal(report.outstandingCents, 7000);
  assert.equal(report.byCourse[0]?.name, "Brows");
});

test("formats the studio phone numbers", () => {
  assert.equal(formatEthiopianPhone("+251946959939"), "+251 94 695 9939");
  assert.equal(formatEthiopianPhone("0919646485"), "+251 91 964 6485");
});
