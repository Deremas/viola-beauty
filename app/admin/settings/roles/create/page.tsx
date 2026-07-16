import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { createStaffRoleAndRedirect } from "../../actions";
import { StaffRoleForm } from "@/components/admin/staff-role-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CreateRolePage() {
  await requirePermission("MANAGE_ROLES");
  return <div className="space-y-6"><Button asChild variant="outline"><Link href="/admin/settings/roles"><ArrowLeft className="h-4 w-4" />Back to roles</Link></Button><Card><CardHeader><CardTitle>Add staff role</CardTitle></CardHeader><CardContent><StaffRoleForm action={createStaffRoleAndRedirect} submitLabel="Create staff role" /></CardContent></Card></div>;
}
