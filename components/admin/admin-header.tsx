import { logout } from "@/app/admin/actions";
import { SessionUser } from "@/lib/permissions";
import { appTimezone } from "@/lib/timezone";
import { AdminProfileMenu } from "@/components/admin/admin-profile-menu";

export default function AdminHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-40 hidden border-b bg-white/85 px-6 py-4 shadow-sm backdrop-blur lg:block">
      <div className="flex items-center justify-end">
        <AdminProfileMenu user={user} timezone={appTimezone} logoutAction={logout} />
      </div>
    </header>
  );
}
