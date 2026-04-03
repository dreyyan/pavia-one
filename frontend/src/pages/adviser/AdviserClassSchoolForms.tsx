/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { GeneralModalConfig } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FormStatus = "DRAFT" | "GENERATED" | "SUBMITTED" | "APPROVED" | "LOCKED";

interface SectionForm {
  id: number;
  type: "SF1" | "SF5";
  status: FormStatus;
  schoolYear: string;
  generatedAt?: string;
  submittedAt?: string;
}

interface SectionInfo {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  color: string;
  classSize: number;
  schoolForms: SectionForm[];
}

interface ImportResult {
  created: number;
  updated: number;
  enrolled: number;
  skippedEnrollment: number;
  errors: { lrn: string; reason: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const FORM_LABELS: Record<string, string> = {
  SF1: "SF1 — Class Register",
  SF5: "SF5 — Report on Promotion",
};

const FORM_DESCRIPTIONS: Record<string, string> = {
  SF1: "The master list of all enrolled students in the section for the school year.",
  SF5: "Records action taken (promoted, conditional, retained) for each student at year-end.",
};

const STATUS_BADGE: Record<FormStatus, string> = {
  DRAFT:     "bg-gray-100 text-gray-500 border border-gray-200",
  GENERATED: "bg-blue-100 text-blue-700 border border-blue-200",
  SUBMITTED: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  APPROVED:  "bg-green-100 text-green-700 border border-green-200",
  LOCKED:    "bg-purple-100 text-purple-700 border border-purple-200",
};

const STATUS_LABEL: Record<FormStatus, string> = {
  DRAFT:     "Draft",
  GENERATED: "Generated",
  SUBMITTED: "Submitted",
  APPROVED:  "Approved",
  LOCKED:    "Locked",
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const AdviserClassSchoolForms = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  const [section, setSection]   = useState<SectionInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState<string | null>(null); // form type currently exporting

  // Import state
  const [importingFor, setImportingFor] = useState<"SF1" | null>(null); // which form is being imported
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult]   = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false, title: "", message: "", type: "default",
    confirmText: "OK", isCancelable: false, onConfirm: () => {},
  });
  const openModal  = (cfg: Partial<Omit<GeneralModalConfig, "isOpen">>) =>
    setGeneralModal((p) => ({ ...p, isOpen: true, ...cfg }));
  const closeModal = () => setGeneralModal((p) => ({ ...p, isOpen: false }));

  // ── Fetch section + its forms ─────────────────────────────────────────────
  const fetchSection = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sections/${sectionId}?includeForms=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) { setShowTokenExpiredModal(true); return; }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch section");
      setSection(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSection(); }, [sectionId]);

  // ── Export handler ────────────────────────────────────────────────────────
  const handleExport = async (formType: "SF1" | "SF5") => {
    setExporting(formType);
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        formType === "SF1"
          ? `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/export`
          : `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf5/export`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check for JSON error response (incomplete data, etc.)
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const errData = await res.json();

        if (!res.ok && errData.data && Array.isArray(errData.data)) {
          // Incomplete student data — show details
          const names = errData.data
            .slice(0, 5)
            .map((s: any) => `• ${s.name}: ${s.missing?.join(", ") || s.missingFields?.join(", ")}`)
            .join("\n");
          const more = errData.data.length > 5 ? `\n...and ${errData.data.length - 5} more.` : "";
          openModal({
            title: `Cannot Export ${formType}`,
            message: `Some students have incomplete information:\n\n${names}${more}\n\nPlease complete their records before exporting.`,
            type: "error",
            confirmText: "Close",
            onConfirm: closeModal,
          });
          return;
        }

        openModal({
          title: `Export Failed`,
          message: errData.message || "An error occurred while generating the file.",
          type: "error",
          confirmText: "Close",
          onConfirm: closeModal,
        });
        return;
      }

      if (!res.ok) {
        openModal({
          title: "Export Failed",
          message: "The server returned an error. Please try again.",
          type: "error",
          confirmText: "Close",
          onConfirm: closeModal,
        });
        return;
      }

      // Stream download
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const disp = res.headers.get("content-disposition") || "";
      const match = disp.match(/filename="?([^"]+)"?/);
      a.href     = url;
      a.download = match ? match[1] : `${formType}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      openModal({
        title: "Export Failed",
        message: err.message || "Network error. Please check your connection.",
        type: "error",
        confirmText: "Close",
        onConfirm: closeModal,
      });
    } finally {
      setExporting(null);
    }
  };

  // ── Import: trigger file picker ───────────────────────────────────────────
  const handleImportClick = (formType: "SF1") => {
    setImportingFor(formType);
    setImportResult(null);
    fileInputRef.current?.click();
  };

  // ── Import: handle file chosen ────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file || !importingFor) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "csv"].includes(ext || "")) {
      openModal({
        title: "Invalid File",
        message: "Please upload a .xlsx or .csv file exported from the SF1 template.",
        type: "error",
        confirmText: "Close",
        onConfirm: closeModal,
      });
      return;
    }

    setImportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const form  = new FormData();
      form.append("sf1File", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/import`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
      );

      const data = await res.json();

      if (!data.success) {
        openModal({
          title: "Import Failed",
          message: data.message || "Could not import the file. Please check the format and try again.",
          type: "error",
          confirmText: "Close",
          onConfirm: closeModal,
        });
        return;
      }

      // Success — show results summary
      const r: ImportResult = data.data?.results;
      setImportResult(r);
      await fetchSection(); // refresh form statuses + classSize

      openModal({
        title: "Import Successful",
        message:
          `${r.created} new student(s) added, ${r.updated} updated, ${r.enrolled} enrolled into your section.` +
          (r.errors.length ? `\n\n${r.errors.length} record(s) had errors and were skipped.` : ""),
        type: "success",
        confirmText: "Done",
        onConfirm: closeModal,
      });

    } catch (err: any) {
      openModal({
        title: "Import Failed",
        message: err.message || "Network error during import.",
        type: "error",
        confirmText: "Close",
        onConfirm: closeModal,
      });
    } finally {
      setImportLoading(false);
      setImportingFor(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-10 px-4 space-y-4">
        <div className="h-8 w-48 bg-[var(--color-bg-200)] rounded animate-pulse" />
        <div className="h-32 bg-[var(--color-bg-100)] rounded-lg animate-pulse" />
        <div className="h-28 bg-[var(--color-bg-100)] rounded-lg animate-pulse" />
        <div className="h-28 bg-[var(--color-bg-100)] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="py-10 px-4">
        <EmptyState
          title="Unable to Load"
          subtitle={error || "Section not found."}
          iconSrc="/error-icon.svg"
        />
      </div>
    );
  }

  const sf1 = section?.schoolForms?.find((f) => f.type === "SF1");
  const sf5 = section?.schoolForms?.find((f) => f.type === "SF5");

  return (
    <div className="py-10 px-4 space-y-5">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* General Modal */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
        isCancelable={generalModal.isCancelable}
      />

      {/* Breadcrumb */}
      <div>
        <nav className="font-roboto text-sm text-[var(--color-text-500)] flex items-center gap-1 flex-wrap">
          <span
            className="cursor-pointer hover:underline text-[var(--color-primary-600)]"
            onClick={() => navigate("/adviser/school-forms")}
          >
            School Forms
          </span>
          <span>/</span>
          <span className="font-medium text-[var(--color-text-900)]">
            Grade {section.gradeLevel} — {section.name}
          </span>
        </nav>
        <h2 className="text-[var(--color-text-800)] mt-1">School Forms</h2>
      </div>

      {/* Section Info Card */}
      <div className="bg-[var(--color-bg-100)] rounded-lg overflow-hidden border border-[var(--color-bg-200)]">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: section.color }}
        />
        <div className="px-4 py-4 flex items-center gap-4 flex-wrap">
          <div
            className="size-12 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ backgroundColor: section.color }}
          >
            G{section.gradeLevel}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--color-text-900)] leading-tight">
              Grade {section.gradeLevel} — {section.name}
            </h3>
            <p className="text-sm text-[var(--color-text-500)] mt-0.5">
              {section.schoolYear} · {section.classSize} student{section.classSize !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-500)]">
          Section Forms
        </h4>

        {/* SF1 Card */}
        <FormCard
          formType="SF1"
          form={sf1}
          onExport={() => handleExport("SF1")}
          onImport={() => handleImportClick("SF1")}
          exporting={exporting === "SF1"}
          importing={importLoading && importingFor === "SF1"}
          supportsImport
        />

        {/* SF5 Card */}
        <FormCard
          formType="SF5"
          form={sf5}
          onExport={() => handleExport("SF5")}
          exporting={exporting === "SF5"}
          importing={false}
          supportsImport={false}
        />
      </div>

      {/* Import result detail (errors) */}
      {importResult && importResult.errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">
            ⚠ {importResult.errors.length} record(s) could not be imported:
          </p>
          <ul className="space-y-1">
            {importResult.errors.map((e, i) => (
              <li key={i} className="text-xs text-amber-700">
                <span className="font-mono font-semibold">{e.lrn}</span>: {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// FormCard sub-component
// ─────────────────────────────────────────────────────────────────────────────
interface FormCardProps {
  formType: "SF1" | "SF5";
  form?: SectionForm;
  onExport: () => void;
  onImport?: () => void;
  exporting: boolean;
  importing: boolean;
  supportsImport: boolean;
}

function FormCard({ formType, form, onExport, onImport, exporting, importing, supportsImport }: FormCardProps) {
  return (
    <div className="bg-white rounded-lg border border-[var(--color-bg-200)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--color-bg-50)] px-4 py-3 border-b border-[var(--color-bg-200)] flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-sm">
              {FORM_LABELS[formType] || formType}
            </p>
            {form ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[form.status]}`}>
                {STATUS_LABEL[form.status]}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-dashed border-gray-300">
                Not Generated
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-500)] mt-1">{FORM_DESCRIPTIONS[formType]}</p>
        </div>
      </div>

      {/* Timestamps */}
      {form && (
        <div className="px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-text-500)] border-b border-[var(--color-bg-100)]">
          <span>Generated: {fmtDate(form.generatedAt)}</span>
          <span>Submitted: {fmtDate(form.submittedAt)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
        {/* Export button */}
        <button
          onClick={onExport}
          disabled={exporting}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
            exporting
              ? "bg-[var(--color-bg-200)] text-[var(--color-text-400)] cursor-not-allowed"
              : "bg-[var(--color-primary-700)] text-white hover:bg-[var(--color-primary-600)]"
          }`}
        >
          {exporting ? (
            <>
              <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <img src="/download-icon.svg" alt="" className="size-3.5" />
              Export {formType}
            </>
          )}
        </button>

        {/* Import button — SF1 only */}
        {supportsImport && (
          <button
            onClick={onImport}
            disabled={importing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              importing
                ? "border-[var(--color-bg-300)] text-[var(--color-text-400)] cursor-not-allowed"
                : "border-[var(--color-primary-600)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
            }`}
            title="Import student list from an SF1 .xlsx or .csv file"
          >
            {importing ? (
              <>
                <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <img src="/upload-icon.svg" alt="" className="size-3.5" />
                Import {formType}
              </>
            )}
          </button>
        )}

        {/* Import hint */}
        {supportsImport && !importing && (
          <p className="text-xs text-[var(--color-text-400)] ml-1">
            Accepts .xlsx or .csv (SF1 format)
          </p>
        )}
      </div>
    </div>
  );
}

export default AdviserClassSchoolForms;