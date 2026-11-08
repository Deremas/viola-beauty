import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { appDate, appTime } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("VIEW_AUDIT_LOGS");
  const query = await searchParams;
  const q = (query.q || "").trim();
  const logs = await prisma.auditLog.findMany({
    where: q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
            { entityType: { contains: q, mode: "insensitive" } },
            { entityId: q },
          ],
        }
      : {},
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Audit log</h1>
        <p className="text-sm text-muted-foreground">Who changed courses, registrations, payments, and website content.</p>
      </div>
      <form className="flex flex-wrap gap-3 rounded-lg border bg-white p-4">
        <Input name="q" defaultValue={q} placeholder="Action, summary, or record id" aria-label="Search audit log" className="max-w-md" />
        <Button type="submit">Search</Button>
        <Button asChild variant="outline"><Link href="/admin/audit">Clear</Link></Button>
      </form>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th className="p-3">When</th><th>Who</th><th>Action</th><th>Record</th><th>Summary</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{appDate(log.createdAt)} {appTime(log.createdAt)}</td>
                <td>{log.actor?.name || "System"}</td>
                <td>{log.action}</td>
                <td>{log.entityType}</td>
                <td>{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No audit entries match this search.</p> : null}
      </div>
    </div>
  );
}
