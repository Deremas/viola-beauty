import { redirect } from "next/navigation";
import type { PermissionKey } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { receptionistDefaultPermissions } from "@/lib/permission-catalog";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "RECEPTIONIST";
  staffRoleName?: string | null;
  permissions: PermissionKey[];
};

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sessionUser = session.user as { id?: string };
  if (!sessionUser.id) redirect("/login");

  const user = await prisma.user.findFirst({
    where: { id: sessionUser.id, isActive: true, deletedAt: null },
    include: { staffRole: { include: { permissions: true } } },
  });
  if (!user) redirect("/login");

  const permissions = user.role === "ADMIN"
    ? []
    : user.staffRole?.isActive && !user.staffRole.deletedAt
      ? user.staffRole.permissions.map((item) => item.permission)
      : receptionistDefaultPermissions;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    staffRoleName: user.staffRole?.name || (user.role === "ADMIN" ? "Administrator" : "Receptionist"),
    permissions,
  } satisfies SessionUser;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/forbidden");
  return user;
}

export function hasPermission(user: SessionUser, permission: PermissionKey) {
  return user.role === "ADMIN" || user.permissions.includes(permission);
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser();
  if (!hasPermission(user, permission)) redirect("/forbidden");
  return user;
}

export function canConfirmPayment(user: SessionUser) {
  return hasPermission(user, "CONFIRM_PAYMENTS");
}

export function canManageSettings(role: string) {
  return role === "ADMIN";
}
