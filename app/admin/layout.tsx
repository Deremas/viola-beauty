import AdminHeader from "@/components/admin/admin-header";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { FormFeedback } from "@/components/admin/form-feedback";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";
import { isDbError } from "@/lib/db-errors";
import { isNextRedirect } from "@/lib/form-feedback";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await requireUser();
    return (
      <div className="min-h-screen lg:flex">
        <AdminSidebar user={user} />
        <div className="min-w-0 flex-1">
          <AdminHeader user={user} />
          <main className="p-4 sm:p-6">
            <FormFeedback />
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (!isDbError(error)) throw error;
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl font-semibold">The studio desk is quiet for a moment.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">Staff lists cannot be loaded right now. Nothing was changed. The public site stays open.</p>
      </main>
    );
  }
}
