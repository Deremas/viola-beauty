import AdminHeader from "@/components/admin/admin-header";
import AdminSidebar from "@/components/admin/admin-sidebar";
import type { Metadata } from "next";
import { requireUser } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen lg:flex">
      <AdminSidebar user={user} />
      <div className="min-w-0 flex-1">
        <AdminHeader user={user} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
