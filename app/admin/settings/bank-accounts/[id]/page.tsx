import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td } from "@/components/ui/table";

export default async function BankAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("MANAGE_BANK_ACCOUNTS"); const { id } = await params;
  const account = await prisma.bankAccount.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { payments: true } } } });
  if (!account) notFound();
  const rows = [["Bank", account.bankName], ["Account holder", account.accountName], ["Account number", account.accountNumber], ["Client instructions", account.instructions || "None"], ["Payment records", String(account._count.payments)]];
  return <div className="mx-auto max-w-3xl space-y-6"><div className="flex justify-between gap-3"><Button asChild variant="outline"><Link href="/admin/settings/bank-accounts"><ArrowLeft className="h-4 w-4" />Back to bank accounts</Link></Button><Button asChild><Link href={`/admin/settings/bank-accounts/${id}/edit`}><Pencil className="h-4 w-4" />Edit bank account</Link></Button></div><Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{account.bankName}</CardTitle><StatusBadge status={account.isActive ? "ACTIVE" : "INACTIVE"} /></div></CardHeader><CardContent><Table><tbody>{rows.map(([label, value]) => <tr key={label}><Td className="w-48 bg-background text-muted-foreground">{label}</Td><Td className="font-medium">{value}</Td></tr>)}</tbody></Table></CardContent></Card></div>;
}
