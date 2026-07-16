import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { createBankAccountAndRedirect } from "../../actions";
import { BankAccountForm } from "@/components/admin/bank-account-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CreateBankAccountPage() {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  return <div className="mx-auto max-w-3xl space-y-6"><Button asChild variant="outline"><Link href="/admin/settings/bank-accounts"><ArrowLeft className="h-4 w-4" />Back to bank accounts</Link></Button><Card><CardHeader><CardTitle>Add bank account</CardTitle></CardHeader><CardContent><BankAccountForm action={createBankAccountAndRedirect} submitLabel="Create bank account" /></CardContent></Card></div>;
}
