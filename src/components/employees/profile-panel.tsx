import { IdCard, Phone } from "lucide-react";
import { Muted } from "@/components/ui/typography";
import { formatDate } from "@/lib/utils";
import type { EmployeeDetail } from "@/lib/queries/employees";

function maskAadhaar(a: string | null): string {
  if (!a) return "—";
  return `XXXX-XXXX-${a.slice(-4)}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Muted className="text-xs">{label}</Muted>
      <p className="mt-1 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export function ProfilePanel({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><IdCard className="h-4 w-4" /> Identity & Government IDs</p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field label="Date of Birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null} />
          <Field label="PAN" value={employee.pan ? <span className="font-mono">{employee.pan}</span> : null} />
          <Field label="Aadhaar" value={<span className="font-mono">{maskAadhaar(employee.aadhaar)}</span>} />
          <Field label="Email" value={employee.email} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Address" value={employee.address} />
        </div>
      </div>

      <div>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Phone className="h-4 w-4" /> Emergency Contact</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" value={employee.emergencyContactName} />
          <Field label="Phone" value={employee.emergencyContactPhone} />
          <Field label="Relation" value={employee.emergencyContactRelation} />
        </div>
      </div>
    </div>
  );
}
