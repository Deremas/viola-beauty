const allowedServiceImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxServiceImageBytes = 5 * 1024 * 1024;

export async function prepareServiceImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!allowedServiceImageTypes.has(file.type)) throw new Error("Service image must be JPG, PNG, or WEBP");
  if (file.size > maxServiceImageBytes) throw new Error("Service image must be 5 MB or smaller");
  return {
    fileName: file.name || "service-image",
    contentType: file.type,
    fileSize: file.size,
    fileData: Buffer.from(await file.arrayBuffer()),
  };
}
