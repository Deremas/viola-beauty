import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { updateBankAccountAndRedirect } from "../../../actions";
import { BankAccountForm } from "@/components/admin/bank-account-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditBankAccountPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  const { id } = await params;
  const account = await prisma.bankAccount.findFirst({ where: { id, deletedAt: null } });
  if (!account) notFound();
  return <div className="mx-auto max-w-3xl space-y-6"><Button asChild variant="outline"><Link href="/admin/settings/bank-accounts"><ArrowLeft className="h-4 w-4" />Back to bank accounts</Link></Button><Card><CardHeader><CardTitle>Edit bank account</CardTitle></CardHeader><CardContent><BankAccountForm account={account} action={updateBankAccountAndRedirect} submitLabel="Save bank account" /></CardContent></Card></div>;
}
