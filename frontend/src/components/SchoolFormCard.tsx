import { useNavigate } from "react-router-dom";
import { useRef } from "react";

interface SectionForm {
  id: number;
  type: "SF1" | "SF5";
  status: "DRAFT" | "GENERATED" | "SUBMITTED" | "APPROVED" | "LOCKED";
  schoolYear: string;
  generatedAt?: string;
  submittedAt?: string;
}

interface SchoolFormCardProps {
  form?: SectionForm;
  sectionId: number;
  sectionColor: string;
  sectionSchoolYear?: string;
  onExport: () => void;
  onImport?: () => void;
  exporting: boolean;
  importing?: boolean;
  supportsImport?: boolean;
}

// Form metadata
const FORM_INFO = {
  SF1: {
    title: "(SF1)",
    description: "School Register",
  },
  SF5: {
    title: "(SF5)",
    description: "Report on Promotion",
  },
} as const;

const STATUS_LABEL: Record<SectionForm["status"], string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  LOCKED: "Locked",
};

const STATUS_COLOR: Record<SectionForm["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  GENERATED: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  LOCKED: "bg-purple-100 text-purple-700",
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const SchoolFormCard: React.FC<SchoolFormCardProps> = ({
  form,
  sectionId,
  sectionColor,
  sectionSchoolYear,
  onExport,
  onImport,
  exporting,
  importing = false,
  supportsImport = false,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formType = form?.type || "SF1";
  const formInfo = FORM_INFO[formType as keyof typeof FORM_INFO] || {
    title: `${formType} Form`,
    description: "School Form",
  };

  const displaySchoolYear = sectionSchoolYear || form?.schoolYear;

  const handleView = () => {
    if (!sectionId) {
      alert("Section ID missing. Cannot view form.");
      return;
    }
    const routeType = formType.toLowerCase();
    navigate(`/forms/${routeType}/${sectionId}/view`);
  };

  const handleImportClick = () => {
    onImport?.();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("sf1File", file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/parse`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to import SF1");
        return;
      }

      alert(`Imported ${data.students?.length || 0} students successfully`);
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import SF1");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg shadow-md text-[var(--color-text-50)] font-roboto overflow-hidden">
      {/* Top Colored Header */}
      <div style={{ backgroundColor: sectionColor }} className="p-4">
        <p className="text-lg font-bold">{formInfo.description} {formInfo.title}</p>
        
        {displaySchoolYear && (
          <p className="text-xs opacity-90 mt-0.5">SY {displaySchoolYear}</p>
        )}

        {/* Status Badge */}
        {form && (
          <div className={`inline-block mt-3 px-3 py-0.5 text-xs font-medium rounded-full ${STATUS_COLOR[form.status]}`}>
            {STATUS_LABEL[form.status]}
          </div>
        )}
      </div>

      {/* Timestamps */}
      {form && (
        <div className="px-4 py-2 bg-[var(--color-bg-50)] text-xs text-[var(--color-text-600)] border-b border-[var(--color-bg-200)]">
          <div className="flex justify-between">
            <span>Generated: <strong>{fmtDate(form.generatedAt)}</strong></span>
            <span>Submitted: <strong>{fmtDate(form.submittedAt)}</strong></span>
          </div>
        </div>
      )}

      {/* Action Buttons - Your original layout preserved */}
      <div className="px-3 py-3 bg-[var(--color-bg-50)] flex gap-2 rounded-b-lg">
        <button
          onClick={handleView}
          style={{ backgroundColor: sectionColor }}
          className="font-figtree text-[var(--color-text-50)] font-bold py-1 px-4 rounded text-sm transition hover:opacity-90 flex-1"
        >
          View
        </button>

        {/* Import Button (SF1 only) */}
        {supportsImport && onImport && (
          <>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center gap-x-1 font-figtree bg-[var(--color-bg-100)] hover:bg-[var(--color-bg-200)] text-[var(--color-text-900)] leading-5 py-1 px-4 rounded font-medium text-xs transition disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import"}
              <img src="/import-icon.svg" className="size-4" alt="import" />
            </button>
            <input
              type="file"
              accept=".xlsx,.csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-x-1 font-figtree bg-[var(--color-bg-100)] hover:bg-[var(--color-bg-200)] text-[var(--color-text-900)] leading-5 py-1 px-4 rounded font-medium text-xs transition disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export"}
          <img src="/export-icon.svg" className="size-4" alt="export" />
        </button>
      </div>
    </div>
  );
};

export default SchoolFormCard;