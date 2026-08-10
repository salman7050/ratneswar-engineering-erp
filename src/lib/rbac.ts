import type { AppRole, Module, Permission } from "@/types";

type Matrix = Record<Module, Partial<Record<Permission, AppRole[]>>>;
const CORE: AppRole[] = ["ADMIN", "OWNER"];
const OWNER_ADMIN: AppRole[] = ["OWNER", "ADMIN"];

/**
 * Final access model: only OWNER and ADMIN logins are accepted by auth.
 * Admin handles daily operations; Owner is the approval authority for
 * high-risk/high-value commercial actions. Both can work normally.
 */
export const PERMISSIONS: Matrix = {
  dashboard: { view: CORE },
  command_center: { view: CORE, create: CORE, edit: CORE, delete: CORE },
  sites: { view: CORE, create: CORE, edit: CORE, delete: CORE },
  tenders: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: ["OWNER"] },
  documents: { view: CORE, create: CORE, edit: CORE, delete: CORE },
  expenses: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: ["OWNER"] },
  employees: { view: [], create: [], edit: [], delete: [] },
  salary: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: [] },
  quotations: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: ["OWNER"] },
  invoices: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: ["OWNER"] },
  billing: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: ["OWNER"] },
  purchase_orders: { view: CORE, create: CORE, edit: CORE, delete: CORE, approve: ["OWNER"] },
  inventory: { view: [], create: [], edit: [], delete: [] },
  reports: { view: CORE },
  users: { view: OWNER_ADMIN, create: OWNER_ADMIN, edit: OWNER_ADMIN, delete: OWNER_ADMIN },
  settings: { view: OWNER_ADMIN, edit: OWNER_ADMIN },
};

export function can(role: AppRole, module: Module, permission: Permission): boolean {
  const allowed = PERMISSIONS[module]?.[permission];
  return Boolean(allowed?.includes(role));
}

export function visibleModules(role: AppRole): Module[] {
  return (Object.keys(PERMISSIONS) as Module[]).filter((m) => can(role, m, "view"));
}
