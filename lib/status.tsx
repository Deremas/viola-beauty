import { Badge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/format";

export function statusTone(status: string): React.ComponentProps<typeof Badge>["tone"] {
  if (["CONFIRMED", "ADVANCE_CONFIRMED", "FULLY_PAID", "ACTIVE", "DONE", "PAID", "APPROVED", "FINISHED", "VERIFIED", "PUBLISHED"].includes(status)) return "green";
  if (["PAYMENT_UPLOADED", "PROOF_UPLOADED", "PENDING_PAYMENT", "TODO", "IN_PROGRESS", "PENDING", "PARTIALLY_PAID", "UNPAID", "SCHEDULED", "STARTED", "OVERDUE", "DRAFT"].includes(status)) return "amber";
  if (["REJECTED", "CANCELLED", "PAYMENT_REJECTED", "NO_SHOW", "EXPIRED", "WITHDRAWN", "REFUNDED"].includes(status)) return "red";
  if (status === "COMPLETED" || status === "POSTPONED") return "blue";
  return "gray";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{formatStatus(status)}</Badge>;
}
