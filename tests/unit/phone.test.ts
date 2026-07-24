import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEthiopianPhone } from "../../lib/phone";

test("normalizes common Ethiopian mobile formats to one value", () => {
  assert.equal(normalizeEthiopianPhone("0912 345 678"), "251912345678");
  assert.equal(normalizeEthiopianPhone("+251 912 345 678"), "251912345678");
  assert.equal(normalizeEthiopianPhone("912345678"), "251912345678");
});

test("rejects invalid phone numbers", () => {
  assert.equal(normalizeEthiopianPhone("1234"), null);
  assert.equal(normalizeEthiopianPhone("0111234567"), null);
});
