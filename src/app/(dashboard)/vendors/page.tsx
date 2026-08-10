import { requirePermission } from "@/lib/auth";
import { getVendorMasters } from "@/lib/queries/vendors";
import { VendorMasterClient } from "@/components/vendors/vendor-master-client";
import { H1, Muted } from "@/components/ui/typography";
export const metadata={title:"Vendors · Ratneswar ERP"};export const dynamic="force-dynamic";
export default async function VendorsPage(){await requirePermission("purchase_orders","view");const vendors=await getVendorMasters();return <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 md:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Master Data</p><H1 className="mt-1 text-2xl md:text-3xl">Vendors</H1><Muted className="mt-1">Save vendor GST/contact details once and reuse them in purchase orders and payments.</Muted></div><VendorMasterClient vendors={vendors}/></div>}
