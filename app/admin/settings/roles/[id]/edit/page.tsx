import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { updateStaffRoleAndRedirect } from "../../../actions";
import { StaffRoleForm } from "@/components/admin/staff-role-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_ROLES");
  const { id } = await params;
  const role = await prisma.staffRole.findFirst({ where: { id, deletedAt: null }, include: { permissions: true } });
  if (!role) notFound();
  return <div className="space-y-6"><Button asChild variant="outline"><Link href="/admin/settings/roles"><ArrowLeft className="h-4 w-4" />Back to roles</Link></Button><Card><CardHeader><CardTitle>Edit {role.name}</CardTitle></CardHeader><CardContent><StaffRoleForm role={role} action={updateStaffRoleAndRedirect} submitLabel="Save staff role" /></CardContent></Card></div>;
}
