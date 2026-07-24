import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return <main className="flex min-h-screen items-center justify-center px-5"><div className="max-w-xl rounded-2xl border bg-white p-7 text-center shadow-soft"><ShieldX className="mx-auto h-10 w-10 text-destructive" /><h1 className="mt-5 font-display text-3xl font-bold">You do not have access to this page.</h1><p className="mt-3 text-muted-foreground">Ask an administrator to add the required permission to your staff role.</p><div className="mt-6"><Button asChild><Link href="/admin/dashboard">Return to dashboard</Link></Button></div></div></main>;
}
