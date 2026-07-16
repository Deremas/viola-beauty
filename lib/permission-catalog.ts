import type { PermissionKey } from "@prisma/client";

export const permissionCatalog: Array<{
  key: PermissionKey;
  label: string;
  description: string;
  group: string;
}> = [
  { key: "VIEW_DASHBOARD", label: "View dashboard", description: "See business summaries and upcoming appointments.", group: "Overview" },
  { key: "VIEW_CALENDAR", label: "View calendar", description: "See the shared appointment calendar.", group: "Calendar" },
  { key: "MANAGE_CALENDAR", label: "Manage calendar", description: "Change availability, breaks, and days off.", group: "Calendar" },
  { key: "VIEW_BOOKINGS", label: "View bookings", description: "Open booking lists and booking details.", group: "Bookings" },
  { key: "CREATE_BOOKINGS", label: "Create bookings", description: "Create bookings for clients from the staff area.", group: "Bookings" },
  { key: "MANAGE_BOOKINGS", label: "Manage bookings", description: "Reschedule, cancel, complete, or mark no-show.", group: "Bookings" },
  { key: "CONFIRM_PAYMENTS", label: "Confirm payments", description: "Approve or reject proofs and record balances.", group: "Payments" },
  { key: "VIEW_CLIENTS", label: "View clients", description: "See client contact details and booking history.", group: "Clients" },
  { key: "MANAGE_CLIENTS", label: "Manage clients", description: "Edit, activate, deactivate, or archive clients.", group: "Clients" },
  { key: "VIEW_PAYMENTS", label: "View payments", description: "See payment records and payment proofs.", group: "Payments" },
  { key: "MANAGE_TASKS", label: "Manage staff tasks", description: "Create, assign, update, and close staff tasks.", group: "Operations" },
  { key: "MANAGE_SERVICES", label: "Manage services", description: "Create, edit, deactivate, and archive services.", group: "Settings" },
  { key: "MANAGE_BANK_ACCOUNTS", label: "Manage bank accounts", description: "Control payment accounts shown to clients.", group: "Settings" },
  { key: "MANAGE_AVAILABILITY", label: "Manage availability", description: "Set working hours, gaps, breaks, and days off.", group: "Settings" },
  { key: "MANAGE_STAFF", label: "Manage staff users", description: "Create, edit, deactivate, and archive receptionist accounts.", group: "Administration" },
  { key: "MANAGE_ROLES", label: "Manage staff roles", description: "Create roles and choose permissions for staff.", group: "Administration" },
  { key: "MANAGE_NOTIFICATIONS", label: "Manage notifications", description: "Configure Telegram and SMS alerts.", group: "Settings" },
  { key: "VIEW_REPORTS", label: "View reports", description: "See operational and financial reports.", group: "Reports" },
];

export const permissionValues = permissionCatalog.map((item) => item.key);

export const receptionistDefaultPermissions: PermissionKey[] = [
  "VIEW_DASHBOARD",
  "VIEW_CALENDAR",
  "VIEW_BOOKINGS",
  "CREATE_BOOKINGS",
  "MANAGE_BOOKINGS",
  "CONFIRM_PAYMENTS",
  "VIEW_CLIENTS",
  "MANAGE_CLIENTS",
  "VIEW_PAYMENTS",
  "MANAGE_TASKS",
];
