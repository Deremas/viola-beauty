export function normalizeEthiopianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^09\d{8}$/.test(digits)) return `251${digits.slice(1)}`;
  if (/^9\d{8}$/.test(digits)) return `251${digits}`;
  if (/^2519\d{8}$/.test(digits)) return digits;
  return null;
}

