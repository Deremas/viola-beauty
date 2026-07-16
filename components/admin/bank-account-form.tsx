import type { ReactNode } from "react";
import type { BankAccount } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BankAccountForm({ account, action, submitLabel }: { account?: BankAccount; action: (formData: FormData) => Promise<void>; submitLabel: string }) {
  return (
    <form action={action} className="grid gap-4">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank name"><Input name="bankName" defaultValue={account?.bankName || ""} placeholder="Awash Bank" required /></Field>
        <Field label="Account holder name"><Input name="accountName" defaultValue={account?.accountName || ""} placeholder="Viola Brows and Beauty" required /></Field>
      </div>
      <Field label="Account number"><Input name="accountNumber" defaultValue={account?.accountNumber || ""} placeholder="0132XXXXXX" required /></Field>
      <Field label="Instructions shown to clients"><Textarea name="instructions" defaultValue={account?.instructions || ""} placeholder="Transfer the required advance and upload a clear receipt." /></Field>
      <Label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={account?.isActive ?? true} />Show this account to clients</Label>
      <div className="flex justify-end"><Button type="submit">{submitLabel}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}

