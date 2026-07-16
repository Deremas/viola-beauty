import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getUploadRoot } from "@/lib/upload-root";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxBytes = 5 * 1024 * 1024;
const databaseProofPrefix = "db-proof:v1:";

const extensionsByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function encodeMetadata(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function shouldStoreProofInDatabase() {
  return process.env.VERCEL === "1" || process.env.PAYMENT_PROOF_STORAGE === "database";
}

export async function savePaymentProof(file: File, bookingCode: string) {
  if (!file || file.size === 0) throw new Error("Payment proof is required");
  if (!allowedTypes.includes(file.type)) throw new Error("Unsupported file type");
  if (file.size > maxBytes) throw new Error("File is larger than 5 MB");

  if (shouldStoreProofInDatabase()) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name || `payment-proof.${extensionsByType[file.type]}`;

    return `${databaseProofPrefix}${encodeMetadata(safeName)}:${encodeMetadata(file.type)}:${file.size}:${bytes.toString("base64")}`;
  }

  const extension = extensionsByType[file.type];
  const relativePath = `payment-proof/${bookingCode}-${randomUUID()}.${extension}`;
  const fullPath = path.join(getUploadRoot(), relativePath);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  return relativePath;
}
