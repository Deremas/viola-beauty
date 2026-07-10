import { savePaymentProof } from "@/lib/upload";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const bookingCode = String(formData.get("bookingCode") || "pending");

  if (!(file instanceof File)) {
    return Response.json({ error: "File is required" }, { status: 400 });
  }

  const screenshotPath = await savePaymentProof(file, bookingCode);
  return Response.json({ screenshotPath });
}
