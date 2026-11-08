const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function readImageFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  if (!imageTypes.has(value.type)) throw new Error("Use a JPG, PNG, or WEBP image.");
  if (value.size > 5 * 1024 * 1024) throw new Error("Each image must be under 5 MB.");
  return { data: Buffer.from(await value.arrayBuffer()), type: value.type, size: value.size };
}
