import type { NavItem } from "@/types";

const CORE_ROLES = ["ADMIN", "OWNER"] as const;

/** Final clean navigation — deliberately excludes Inventory and expiry/reminder modules. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard", icon: "LayoutDashboard", roles: [...CORE_ROLES] },
  { label: "Sites / Projects", href: "/sites", module: "sites", icon: "MapPinned", roles: [...CORE_ROLES] },
  { label: "Clients", href: "/clients", module: "billing", icon: "Building2", roles: [...CORE_ROLES] },
  { label: "Vendors", href: "/vendors", module: "purchase_orders", icon: "Users", roles: [...CORE_ROLES] },
  { label: "Quotations", href: "/quotations", module: "quotations", icon: "FileText", roles: [...CORE_ROLES] },
  { label: "Purchase Orders", href: "/purchase-orders", module: "purchase_orders", icon: "ShoppingCart", roles: [...CORE_ROLES] },
  { label: "Invoices", href: "/invoices", module: "invoices", icon: "Receipt", roles: [...CORE_ROLES] },
  { label: "Expenses & Payments", href: "/expenses", module: "expenses", icon: "WalletCards", roles: [...CORE_ROLES] },
  { label: "Salary Records", href: "/salary", module: "salary", icon: "FileSpreadsheet", roles: [...CORE_ROLES] },
  { label: "Receivables & Payables", href: "/billing", module: "billing", icon: "Landmark", roles: [...CORE_ROLES] },
  { label: "Reports", href: "/analytics", module: "reports", icon: "BarChart3", roles: [...CORE_ROLES] },
  { label: "Documents", href: "/documents", module: "documents", icon: "FolderOpen", roles: [...CORE_ROLES] },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Access Control", href: "/users", module: "users", icon: "ShieldCheck", roles: [...CORE_ROLES] },
  { label: "Settings / Masters", href: "/settings", module: "settings", icon: "Settings", roles: [...CORE_ROLES] },
];

export const COMPANY = {
  name: "Ratneswar Engineering",
  legalName: "Ratneswar Engineering",
  tagline: "Electrical, Mechanical, Civil & Solar Contractor",
  gstin: "24ABKFR8021K1ZZ",
  address: "Office No. 19, Sanghvi Square Complex, Salarinaka, Rapar–Kutch, Gujarat – 370165",
  phone: "84010 50053 / 78019 56980",
  email: "ratneswarengineering@gmail.com",
};
