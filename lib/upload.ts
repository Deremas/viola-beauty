import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxBytes = 5 * 1024 * 1024;

export async function savePaymentProof(file: File, bookingCode: string) {
  if (!file || file.size === 0) throw new Error("Payment proof is required");
  if (!allowedTypes.includes(file.type)) throw new Error("Unsupported file type");
  if (file.size > maxBytes) throw new Error("File is larger than 5 MB");

  const uploadRoot = process.env.UPLOAD_DIR || "./storage/uploads";
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const relativePath = `payment-proof/${bookingCode}-${randomUUID()}.${extension}`;
  const fullPath = path.join(process.cwd(), uploadRoot, relativePath);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  return relativePath;
}
