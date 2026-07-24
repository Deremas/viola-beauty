"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type BankAccountOption = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string | null;
};

export function BankAccountSelector({ accounts }: { accounts: BankAccountOption[] }) {
  const [bankAccountId, setBankAccountId] = useState(accounts[0]?.id ?? "");
  const [copied, setCopied] = useState<string | null>(null);
  const selectedAccount = accounts.find((account) => account.id === bankAccountId);

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advance Payment</CardTitle>
        <CardDescription>Pay the advance, then upload a clear screenshot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select name="bankAccountId" required value={bankAccountId} onChange={(event) => setBankAccountId(event.target.value)}>
          <option value="">Select bank account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.bankName} - {account.accountNumber}
            </option>
          ))}
        </Select>

        {selectedAccount ? (
          <div className="rounded-md border bg-muted/50 p-4 text-sm">
            <div className="font-semibold">{selectedAccount.bankName}</div>
            <div className="mt-3 grid gap-3">
              <CopyRow
                label="Account name"
                value={selectedAccount.accountName}
                copied={copied === "name"}
                onCopy={() => copyValue("name", selectedAccount.accountName)}
              />
              <CopyRow
                label="Account number"
                value={selectedAccount.accountNumber}
                copied={copied === "number"}
                onCopy={() => copyValue("number", selectedAccount.accountNumber)}
              />
              {selectedAccount.instructions ? (
                <div>
                  <p className="text-muted-foreground">Payment note</p>
                  <p className="font-medium">{selectedAccount.instructions}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">No active bank account selected.</p>
        )}

        <div className="space-y-2">
          <label htmlFor="paymentProof" className="text-sm font-semibold">Payment proof (required)</label>
          <Input id="paymentProof" name="paymentProof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
          <p className="text-xs text-muted-foreground">Required. JPG, PNG, WEBP, or PDF up to 5 MB.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold tracking-wide">{value}</p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          onClick={onCopy}
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
