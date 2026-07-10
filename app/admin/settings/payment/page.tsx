import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSettingsPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Payment settings</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground">Advance payment amounts are configured per service.</p>
        <Link className="font-semibold text-primary" href="/admin/settings/services">Manage service payment rules</Link>
      </CardContent>
    </Card>
  );
}
