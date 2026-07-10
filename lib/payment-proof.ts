import { readFile, stat } from "fs/promises";
import path from "path";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function getUploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./storage/uploads");
}

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

export async function readLocalPaymentProof(relativePath: string) {
  const { filePath } = getSafeProofPath(relativePath);
  const file = await readFile(filePath);

  return {
    file,
    fileName: path.basename(filePath),
    contentType: getProofContentType(filePath),
  };
}

export async function getLocalPaymentProofInfo(relativePath: string) {
  try {
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
