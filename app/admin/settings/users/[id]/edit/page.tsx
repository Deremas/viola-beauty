import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { updateUserAndRedirect } from "../../../actions";
import { StaffUserForm } from "@/components/admin/staff-user-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_STAFF");
  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.user.findFirst({ where: { id, deletedAt: null } }),
    prisma.staffRole.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" } }),
  ]);
  if (!user) notFound();
  return <div className="mx-auto max-w-3xl space-y-6"><Button asChild variant="outline"><Link href="/admin/settings/users"><ArrowLeft className="h-4 w-4" />Back to staff users</Link></Button><Card><CardHeader><CardTitle>Edit {user.name}</CardTitle></CardHeader><CardContent><StaffUserForm user={user} roles={roles} action={updateUserAndRedirect} submitLabel="Save staff user" /></CardContent></Card></div>;
}
