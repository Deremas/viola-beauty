import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { createReceptionistAndRedirect } from "../../actions";
import { StaffUserForm } from "@/components/admin/staff-user-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function CreateReceptionistPage() { await requirePermission("MANAGE_STAFF"); const roles = await prisma.staffRole.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" } }); return <div className="mx-auto max-w-3xl space-y-6"><Button asChild variant="outline"><Link href="/admin/settings/receptionists"><ArrowLeft className="h-4 w-4" />Back to receptionists</Link></Button><Card><CardHeader><CardTitle>Add receptionist</CardTitle></CardHeader><CardContent><StaffUserForm staffOnly roles={roles} action={createReceptionistAndRedirect} submitLabel="Create receptionist" /></CardContent></Card></div>; }
