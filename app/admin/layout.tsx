import AdminHeader from "@/components/admin/admin-header";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { requireUser } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader user={user} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
