import { readFile, stat } from "fs/promises";
import path from "path";
import { getUploadRoot } from "@/lib/upload-root";

const databaseProofPrefix = "db-proof:v1:";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function getSafeProofPath(relativePath: string) {
  const uploadRoot = getUploadRoot();
  const filePath = path.resolve(uploadRoot, relativePath);
  const safeRoot = uploadRoot.endsWith(path.sep) ? uploadRoot : `${uploadRoot}${path.sep}`;

  if (filePath !== uploadRoot && !filePath.startsWith(safeRoot)) {
    throw new Error("Invalid payment proof path");
  }

  return { filePath, uploadRoot };
}

export function getProofContentType(filePath: string) {
  return contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function isDatabaseProof(value: string) {
  return value.startsWith(databaseProofPrefix);
}

function decodeDatabaseProof(value: string) {
  const [prefix, version, encodedName, encodedType, encodedSize, encodedFile] = value.split(":", 6);

  if (`${prefix}:${version}:` !== databaseProofPrefix || !encodedName || !encodedType || !encodedFile) {
    throw new Error("Invalid database payment proof");
  }

  const fileName = Buffer.from(encodedName, "base64url").toString("utf8");
  const contentType = Buffer.from(encodedType, "base64url").toString("utf8");
  const file = Buffer.from(encodedFile, "base64");
  const declaredSize = Number(encodedSize);

  if (!Number.isFinite(declaredSize) || declaredSize !== file.length) {
    throw new Error("Invalid database payment proof size");
  }

  return {
    file,
    fileName,
    contentType,
  };
}

export async function readPaymentProof(relativePath: string) {
  if (isDatabaseProof(relativePath)) {
    return decodeDatabaseProof(relativePath);
  }

  const { filePath } = getSafeProofPath(relativePath);
  const file = await readFile(filePath);

  return {
    file,
    fileName: path.basename(filePath),
    contentType: getProofContentType(filePath),
  };
}

export async function getPaymentProofInfo(relativePath: string) {
  try {
    if (isDatabaseProof(relativePath)) {
      const proof = decodeDatabaseProof(relativePath);

      return {
        exists: true,
        fileName: proof.fileName,
        contentType: proof.contentType,
        sizeBytes: proof.file.length,
        isImage: proof.contentType.startsWith("image/"),
        isPdf: proof.contentType === "application/pdf",
      };
    }

    const { filePath } = getSafeProofPath(relativePath);
    const fileStat = await stat(filePath);
    const contentType = getProofContentType(filePath);

    return {
      exists: true,
      fileName: path.basename(filePath),
      contentType,
      sizeBytes: fileStat.size,
      isImage: contentType.startsWith("image/"),
      isPdf: contentType === "application/pdf",
    };
  } catch {
    return {
      exists: false,
      fileName: path.basename(relativePath),
      contentType: "application/octet-stream",
      sizeBytes: 0,
      isImage: false,
      isPdf: false,
    };
  }
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
