"use client";

import * as React from "react";
import { Building2, FileText, Landmark, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCompanySettings } from "@/lib/actions/finance-settings-actions";
import { useAction } from "@/hooks/use-action";

interface CompanySettings {
  legalName: string; tradeName: string; tagline: string; gstin: string; pan: string | null; address: string; city: string; state: string; stateCode: string; pincode: string | null; phone: string; email: string; website: string | null; logoUrl: string | null;
  signatoryName: string; signatureUrl: string | null; jurisdiction: string; declaration: string; defaultPaymentTerms: string; defaultQuoteTerms: string; quotationRefPrefix: string; quotationValidityDays: number; ownerApprovalThreshold: number; defaultPoTerms: string;
  poContactName: string; poContactEmail: string; poContactPhone: string;
  aiMode: string; aiProvider: string; ollamaBaseUrl: string; ollamaModel: string;
}

function SectionTitle({ icon: Icon, title, description }: { icon: typeof Building2; title: string; description: string }) {
  return <div className="sm:col-span-2 flex items-start gap-3 border-b border-slate-200 pb-3 pt-2"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon className="h-4 w-4" /></div><div><h3 className="text-sm font-semibold text-slate-950">{title}</h3><p className="text-xs text-slate-500">{description}</p></div></div>;
}

export function CompanySettingsForm({ company }: { company: CompanySettings }) {
  const [form, setForm] = React.useState({
    legalName: company.legalName, tradeName: company.tradeName, tagline: company.tagline, gstin: company.gstin, pan: company.pan ?? "", address: company.address, city: company.city, state: company.state, stateCode: company.stateCode, pincode: company.pincode ?? "", phone: company.phone, email: company.email, website: company.website ?? "", logoUrl: company.logoUrl ?? "",
    signatoryName: company.signatoryName, signatureUrl: company.signatureUrl ?? "", jurisdiction: company.jurisdiction, declaration: company.declaration, defaultPaymentTerms: company.defaultPaymentTerms, defaultQuoteTerms: company.defaultQuoteTerms, quotationRefPrefix: company.quotationRefPrefix, quotationValidityDays: String(company.quotationValidityDays), ownerApprovalThreshold: String(company.ownerApprovalThreshold), defaultPoTerms: company.defaultPoTerms,
    poContactName: company.poContactName, poContactEmail: company.poContactEmail, poContactPhone: company.poContactPhone,
    aiMode: "CLOUD", aiProvider: "CLOUDFLARE", ollamaBaseUrl: "https://api.cloudflare.com/client/v4", ollamaModel: company.ollamaModel || "@cf/zai-org/glm-4.7-flash",
  });
  const { run, loading } = useAction(updateCompanySettings, { successMessage: "Company settings saved" });
  function set<K extends keyof typeof form>(key: K, value: string) { setForm((f) => ({ ...f, [key]: value })); }
  return <form onSubmit={(e) => { e.preventDefault(); run({ ...form, aiMode: "CLOUD" as const, aiProvider: "CLOUDFLARE", ollamaBaseUrl: "https://api.cloudflare.com/client/v4", quotationValidityDays: Number(form.quotationValidityDays), ownerApprovalThreshold: Number(form.ownerApprovalThreshold) }); }} className="grid gap-4 sm:grid-cols-2">
    <SectionTitle icon={Building2} title="Company identity" description="Used throughout the ERP and on Ratneswar-issued documents." />
    <div className="space-y-1.5"><Label>Trade Name</Label><Input value={form.tradeName} onChange={(e)=>set("tradeName",e.target.value)} /></div><div className="space-y-1.5"><Label>Legal Name</Label><Input value={form.legalName} onChange={(e)=>set("legalName",e.target.value)} /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Tagline / Nature of Business</Label><Input value={form.tagline} onChange={(e)=>set("tagline",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin} onChange={(e)=>set("gstin",e.target.value.toUpperCase())} /></div><div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan} onChange={(e)=>set("pan",e.target.value.toUpperCase())} /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Registered Address</Label><Textarea value={form.address} onChange={(e)=>set("address",e.target.value)} rows={3} /></div>
    <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e)=>set("city",e.target.value)} /></div><div className="space-y-1.5"><Label>Pincode</Label><Input value={form.pincode} onChange={(e)=>set("pincode",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={(e)=>set("state",e.target.value)} /></div><div className="space-y-1.5"><Label>State Code</Label><Input value={form.stateCode} onChange={(e)=>set("stateCode",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e)=>set("phone",e.target.value)} /></div><div className="space-y-1.5"><Label>Company Email</Label><Input type="email" value={form.email} onChange={(e)=>set("email",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e)=>set("website",e.target.value)} placeholder="https://…" /></div><div className="space-y-1.5"><Label>Logo URL (optional)</Label><Input value={form.logoUrl} onChange={(e)=>set("logoUrl",e.target.value)} placeholder="Built-in Ratneswar logo is used by default" /></div>

    <SectionTitle icon={FileText} title="Document defaults" description="Editable wording and contact details. Signature + stamp images are managed in the separate panel below." />
    <div className="space-y-1.5"><Label>Authorised Signatory Label</Label><Input value={form.signatoryName} onChange={(e)=>set("signatoryName",e.target.value)} /></div><div className="space-y-1.5"><Label>Jurisdiction</Label><Input value={form.jurisdiction} onChange={(e)=>set("jurisdiction",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>PO Contact Name</Label><Input value={form.poContactName} onChange={(e)=>set("poContactName",e.target.value)} /></div><div className="space-y-1.5"><Label>PO Contact Email</Label><Input type="email" value={form.poContactEmail} onChange={(e)=>set("poContactEmail",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>PO Contact Phone</Label><Input value={form.poContactPhone} onChange={(e)=>set("poContactPhone",e.target.value)} /></div><div className="space-y-1.5"><Label>Default Payment Terms</Label><Input value={form.defaultPaymentTerms} onChange={(e)=>set("defaultPaymentTerms",e.target.value)} /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Declaration</Label><Textarea rows={3} value={form.declaration} onChange={(e)=>set("declaration",e.target.value)} /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Default Quotation Terms</Label><Textarea rows={4} value={form.defaultQuoteTerms} onChange={(e)=>set("defaultQuoteTerms",e.target.value)} /></div>
    <div className="space-y-1.5"><Label>Quotation Ref Prefix</Label><Input value={form.quotationRefPrefix} onChange={(e)=>set("quotationRefPrefix",e.target.value.toUpperCase())} /></div><div className="space-y-1.5"><Label>Quotation Validity (Days)</Label><Input type="number" min="1" max="365" value={form.quotationValidityDays} onChange={(e)=>set("quotationValidityDays",e.target.value)} /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Owner Approval Amount Threshold (₹)</Label><Input type="number" min="0" step="1" value={form.ownerApprovalThreshold} onChange={(e)=>set("ownerApprovalThreshold",e.target.value)} /><p className="text-[11px] text-slate-500">High-risk work can be routed to Jaydipsinh (Owner). Set 0 to disable amount-only routing.</p></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Default Purchase Order Terms</Label><Textarea rows={4} value={form.defaultPoTerms} onChange={(e)=>set("defaultPoTerms",e.target.value)} /></div>

    <SectionTitle icon={Sparkles} title="Ratneswar AI — Cloud Mode" description="Runs in the cloud. No office PC, local worker or Ollama installation is required." />
    <div className="space-y-1.5"><Label>AI Mode</Label><Input value="Cloud" readOnly /></div>
    <div className="space-y-1.5"><Label>AI Provider</Label><Input value="Cloudflare Workers AI" readOnly /></div>
    <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">AI credentials are stored only in the cloud hosting environment, not inside the browser or company database. ERP data remains in the shared cloud database.</div>
    <div className="sm:col-span-2 flex justify-end border-t border-slate-200 pt-4"><Button type="submit" size="lg" loading={loading}><Landmark className="h-4 w-4" /> Save All Settings</Button></div>
  </form>;
}
