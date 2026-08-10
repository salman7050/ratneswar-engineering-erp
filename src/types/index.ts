export const ROLES = [
  "ADMIN",
  "OWNER",
  "ENGINEER",
  "ACCOUNTANT",
  "STORE",
  "HR",
] as const;

export type AppRole = (typeof ROLES)[number];

export interface AppUser {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: AppRole;
  avatarUrl?: string | null;
  isActive: boolean;
}

export type Module =
  | "dashboard"
  | "command_center"
  | "sites"
  | "tenders"
  | "documents"
  | "expenses"
  | "employees"
  | "salary"
  | "quotations"
  | "invoices"
  | "billing"
  | "purchase_orders"
  | "inventory"
  | "reports"
  | "users"
  | "settings";

export type Permission = "view" | "create" | "edit" | "delete" | "approve";

export interface NavItem {
  label: string;
  href: string;
  module: Module;
  icon: string; // lucide-react icon name, resolved in sidebar
  roles: AppRole[]; // which roles see this item
  badge?: "count" | "new";
}
