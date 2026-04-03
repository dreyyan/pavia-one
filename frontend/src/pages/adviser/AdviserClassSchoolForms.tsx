/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { GeneralModalConfig } from "../../types";
import SchoolFormCard from "../../components/SchoolFormCard";

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
      `${import.meta.env.VITE_API_BASE_URL}/api/adviser/forms/section/${sectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 401) { setShowTokenExpiredModal(true); return; }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch section");

    const rawSection = data.data.section;

    // Map API response to frontend SectionInfo type
    const mappedSection: SectionInfo = {
      id: rawSection.id,
      name: rawSection.name,
      gradeLevel: rawSection.gradeLevel,
      schoolYear: rawSection.schoolYear,
      color: "#4F46E5", // you can customize this or fetch from constants
      classSize: data.data.students?.length || 0,
      schoolForms: rawSection.schoolForms.map((f: any) => ({
        id: f.id,
        type: f.type,
        status: f.status as FormStatus,
        schoolYear: f.schoolYear,
        generatedAt: f.generatedAt ?? undefined,
        submittedAt: f.submittedAt ?? undefined,
      })),
    };

    setSection(mappedSection);

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

  console.log("Full schoolForms array:", section?.schoolForms);

  const sf1 = section?.schoolForms?.find((f) => 
    f.type?.toString().toUpperCase() === "SF1"
  );
  const sf5 = section?.schoolForms?.find((f) => 
    f.type?.toString().toUpperCase() === "SF5"
  );

  console.log("Extracted SF1:", sf1);
  console.log("Extracted SF5:", sf5);

  // *[BREADCRUMBS] Admin Adviser Details navigation
  const breadcrumbs = [
    { label: "School Forms", path: "/adviser/school-forms" },
    { label: `${section?.gradeLevel} - ${section?.name}`, path: null },
  ];

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

      {/* [SECTION] Header & Breadcrumbs */}
      <div>
        <h2 className="text-[var(--color-text-800)] leading-0">Adviser Details</h2>
        <nav className="font-roboto text-sm text-[var(--color-text-700)]">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx}>
              {crumb.path ? (
                <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>
                  {crumb.label}
                </span>
              ) : (
                <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && " / "}
            </span>
          ))}
        </nav>
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
              Grade {section.gradeLevel} | {section.name}
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
        <SchoolFormCard
          form={sf1}
          sectionId={section.id}
          sectionColor={section.color}
          sectionSchoolYear={section.schoolYear}
          onExport={() => handleExport("SF1")}
          onImport={() => handleImportClick("SF1")}
          exporting={exporting === "SF1"}
          importing={importLoading && importingFor === "SF1"}
          supportsImport={true}
        />

        {/* SF5 Card */}
        <SchoolFormCard
          form={sf5}
          sectionId={section.id}
          sectionColor={section.color}
          sectionSchoolYear={section.schoolYear}
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

export default AdviserClassSchoolForms;