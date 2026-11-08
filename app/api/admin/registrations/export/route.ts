import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { appDate } from "@/lib/timezone";

export async function GET(request: Request) {
  await requirePermission("EXPORT_REGISTRATIONS");
  const url = new URL(request.url);
  const course = url.searchParams.get("course");
  const registrations = await prisma.courseRegistration.findMany({
    where: course ? { courseId: course } : {},
    include: { student: true, course: true },
    orderBy: { registeredAt: "desc" },
    take: 5000,
  });
  const header = ["Reference", "Student", "Phone", "Course", "Intake", "Registered", "Registration", "Payment", "Class"];
  const lines = registrations.map((item) => [item.registrationNumber, item.student.fullName, item.student.phone, item.course.name, item.intakeName || "", appDate(item.registeredAt), item.registrationStatus, item.paymentStanding, item.classProgress].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return new Response(`\uFEFF${header.join(",")}\n${lines.join("\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=course-registrations.csv" },
  });
}
