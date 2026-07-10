import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { createBankAccount, updateBankAccount } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function BankAccountsPage() {
  const accounts = await prisma.bankAccount.findMany({ orderBy: { bankName: "asc" } });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add bank account</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBankAccount} className="grid gap-3">
            <Field label="Bank name">
              <Input name="bankName" placeholder="Awash Bank" required />
            </Field>
            <Field label="Account holder name">
              <Input name="accountName" placeholder="Viola Brows and Beauty" required />
            </Field>
            <Field label="Account number">
              <Input name="accountNumber" placeholder="0132XXXXXX" required />
            </Field>
            <Field label="Client payment instructions">
              <Textarea name="instructions" placeholder="Transfer the required advance, then upload the receipt screenshot." />
            </Field>
            <Label className="flex items-center gap-2">
              <input name="isActive" type="checkbox" defaultChecked /> Show this account to clients
            </Label>
            <Button type="submit">Create bank account</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank accounts shown to clients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bank accounts have been created yet.</p>
          ) : null}

          {accounts.map((account) => (
            <form key={account.id} action={updateBankAccount} className="rounded-lg border bg-white p-4 shadow-soft">
              <input type="hidden" name="id" value={account.id} />
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{account.bankName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {account.accountName} - {account.accountNumber}
                  </p>
                </div>
                <Label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold">
                  <input name="isActive" type="checkbox" defaultChecked={account.isActive} /> Show to clients
                </Label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Bank name">
                  <Input name="bankName" defaultValue={account.bankName} required />
                </Field>
                <Field label="Account holder name">
                  <Input name="accountName" defaultValue={account.accountName} required />
                </Field>
                <Field label="Account number">
                  <Input name="accountNumber" defaultValue={account.accountNumber} required />
                </Field>
                <Field label="Client payment instructions" className="md:col-span-3">
                  <Textarea name="instructions" defaultValue={account.instructions || ""} />
                </Field>
              </div>

              <Button type="submit" variant="outline" className="mt-4">
                Update bank account settings
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}
