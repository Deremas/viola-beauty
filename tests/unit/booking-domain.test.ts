import test from "node:test";
import assert from "node:assert/strict";
import { formatDuration } from "../../lib/format";
import { localDateTimeToUtc } from "../../lib/timezone";
import { requestFingerprint, securityHash } from "../../lib/security";

process.env.AUTH_SECRET ||= "unit-test-secret-that-is-not-used-in-production";

test("formats hour and half-hour service durations clearly", () => {
  assert.equal(formatDuration(30), "30 min");
  assert.equal(formatDuration(60), "1 hr");
  assert.equal(formatDuration(150), "2 hrs 30 min");
});

test("converts East Africa booking time to UTC consistently", () => {
  assert.equal(localDateTimeToUtc("2026-07-24", "14:00").toISOString(), "2026-07-24T11:00:00.000Z");
});

test("submission fingerprints are stable but change with booking details", () => {
  const first = requestFingerprint(["service-a", "2026-07-24", "14:00", "251912345678"]);
  const retry = requestFingerprint(["service-a", "2026-07-24", "14:00", "251912345678"]);
  const changed = requestFingerprint(["service-a", "2026-07-24", "15:00", "251912345678"]);
  assert.equal(first, retry);
  assert.notEqual(first, changed);
});

test("security hashes do not store their source values", () => {
  const source = "203.0.113.10";
  const hashed = securityHash(source);
  assert.notEqual(hashed, source);
  assert.equal(hashed.length, 64);
});
