import Link from "next/link";
import { Eye, Pencil, Plus, Power, PowerOff, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StatusBadge } from "@/lib/status";
import { archiveBankAccount, restoreBankAccount, setBankAccountActive } from "../actions";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function BankAccountsPage() {
  await requirePermission("MANAGE_BANK_ACCOUNTS");
  const accounts = await prisma.bankAccount.findMany({
    include: { _count: { select: { payments: true } } },
    orderBy: [{ deletedAt: "asc" }, { bankName: "asc" }],
  });
  const current = accounts.filter((account) => !account.deletedAt);
  const archived = accounts.filter((account) => account.deletedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Bank accounts</h1>
          <p className="text-sm text-muted-foreground">Control which payment accounts clients can select during booking.</p>
        </div>
        <Button asChild><Link href="/admin/settings/bank-accounts/create"><Plus className="h-4 w-4" />Add bank account</Link></Button>
      </div>

      <AccountTable title="Current bank accounts" accounts={current} />

      {archived.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Archived bank accounts</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <thead><tr><Th>Bank</Th><Th>Account holder</Th><Th>Account number</Th><Th>Previous payments</Th><Th>Action</Th></tr></thead>
              <tbody>{archived.map((account) => (
                <tr key={account.id}>
                  <Td className="min-w-52 font-semibold">{account.bankName}</Td>
                  <Td>{account.accountName}</Td><Td>{account.accountNumber}</Td><Td>{account._count.payments}</Td>
                  <Td><form action={restoreBankAccount}><input type="hidden" name="id" value={account.id} /><Button type="submit" variant="outline" size="icon" title="Restore bank account"><RotateCcw className="h-4 w-4" /><span className="sr-only">Restore bank account</span></Button></form></Td>
                </tr>
              ))}</tbody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

type AccountRow = Awaited<ReturnType<typeof prisma.bankAccount.findMany<{ include: { _count: { select: { payments: true } } } }>>>[number];

function AccountTable({ title, accounts }: { title: string; accounts: AccountRow[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <thead><tr><Th className="min-w-52">Bank</Th><Th>Account holder</Th><Th>Account number</Th><Th>Payments</Th><Th>Status</Th><Th className="min-w-52">Actions</Th></tr></thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <Td className="font-semibold">{account.bankName}</Td><Td>{account.accountName}</Td><Td>{account.accountNumber}</Td><Td>{account._count.payments}</Td>
                <Td><StatusBadge status={account.isActive ? "ACTIVE" : "INACTIVE"} /></Td>
                <Td><div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/settings/bank-accounts/${account.id}`}><Eye className="h-4 w-4" />View</Link></Button>
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/settings/bank-accounts/${account.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link></Button>
                  <form action={setBankAccountActive}><input type="hidden" name="id" value={account.id} /><input type="hidden" name="isActive" value={account.isActive ? "false" : "true"} /><Button type="submit" variant="outline" size="sm">{account.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}{account.isActive ? "Pause" : "Open"}</Button></form>
                  <ConfirmDeleteButton action={archiveBankAccount} id={account.id} name={account.bankName} label="Remove" description="This account leaves the booking list. Past payments stay on record, and you can restore it from the archive." />
                </div></Td>
              </tr>
            ))}
            {accounts.length === 0 ? <tr><Td colSpan={6} className="text-center text-muted-foreground">No bank accounts found.</Td></tr> : null}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
