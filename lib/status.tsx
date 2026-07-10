import { Badge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/format";

export function statusTone(status: string): React.ComponentProps<typeof Badge>["tone"] {
  if (status === "CONFIRMED" || status === "ADVANCE_CONFIRMED" || status === "FULLY_PAID" || status === "ACTIVE" || status === "DONE") return "green";
  if (status === "PAYMENT_UPLOADED" || status === "PROOF_UPLOADED" || status === "PENDING_PAYMENT" || status === "TODO" || status === "IN_PROGRESS") return "amber";
  if (status === "REJECTED" || status === "CANCELLED" || status === "PAYMENT_REJECTED") return "red";
  if (status === "COMPLETED") return "blue";
  return "gray";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{formatStatus(status)}</Badge>;
}
