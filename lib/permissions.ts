import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "RECEPTIONIST";
};

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export function canConfirmPayment(role: string) {
  return role === "ADMIN" || role === "RECEPTIONIST";
}

export function canManageSettings(role: string) {
  return role === "ADMIN";
}
