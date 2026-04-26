/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import Breadcrumbs from "../../components/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";
import ClassCard from "../../components/cards/ClassCard";
import SchoolFormActionCard from "../../components/cards/SchoolFormActionCard";

// [IMPORT] Helpers, Constants & Types
import { GeneralModalConfig, SchoolFormStatus, SectionInfo, ImportResult } from "../../types";
import { SECTION_FORMS, STUDENT_FORMS } from "../../constants";

const AdviserClassSchoolForms = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES] Entities
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // [STATES] Import / Export
  const [exporting, setExporting] = useState<string | null>(null);
  const [importingFor, setImportingFor] = useState<"SF1" | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: false,
    onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // * [HANDLE] Fetch Section and Its School Forms
  const fetchSection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/forms/section/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) { setShowTokenExpiredModal(true); return; }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch section");

      const raw = data.data.section;
      setSection({
        id: raw.id,
        name: raw.name,
        gradeLevel: raw.gradeLevel,
        schoolYear: raw.schoolYear,
        color: raw.color,
        curriculum: raw.curriculum,
        classSize: data.data.students?.length || 0,
        schoolForms: raw.schoolForms.map((f: any) => ({
          id: f.id,
          type: f.type,
          status: f.status as SchoolFormStatus,
          schoolYear: f.schoolYear,
          generatedAt: f.generatedAt ?? undefined,
          submittedAt: f.submittedAt ?? undefined,
        })),
      });
    } catch (err: any) {
      // ! [ERROR] Fetching section failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Section",
        message: "We couldn't load the section at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSection();
  }, [sectionId]);

  // * [HANDLE] Export School Form
  const handleExport = async (formType: "SF1" | "SF2" | "SF5" | "SF9" | "SF10") => {
    setExporting(formType);
    try {
      const token = localStorage.getItem("token");
      const endpointMap: Record<string, string> = {
        SF1: `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/export`,
        SF2: `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf2/export`,
        SF5: `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf5/export`,
        SF9: `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf9/export`,
        SF10: `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf10/export`,
      };

      const res = await fetch(endpointMap[formType], {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const errData = await res.json();

        if (!res.ok && errData.data && Array.isArray(errData.data)) {
          const names = errData.data
            .slice(0, 5)
            .map((s: any) => `• ${s.name}: ${(s.missing ?? s.missingFields ?? []).join(", ")}`)
            .join("\n");
          const more = errData.data.length > 5 ? `\n...and ${errData.data.length - 5} more.` : "";
          openGeneralModal({
            title: `Cannot Export ${formType}`,
            message: `Some students have incomplete information:\n\n${names}${more}\n\nPlease complete their records before exporting.`,
            type: "error",
            confirmText: "Close",
            onConfirm: () => closeGeneralModal(),
          });
          return;
        }

        openGeneralModal({
          title: "Export Failed",
          message: errData.message || "An error occurred while generating the file.",
          type: "error",
          confirmText: "Close",
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }

      if (!res.ok) {
        openGeneralModal({
          title: "Export Failed",
          message: "The server returned an error. Please try again.",
          type: "error",
          confirmText: "Close",
          onConfirm: () => closeGeneralModal(),
        });
        return;
      }

      // [DOWNLOAD] Stream the file blob to the user
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disp = res.headers.get("content-disposition") || "";
      const match = disp.match(/filename="?([^"]+)"?/);
      a.href = url;
      a.download = match ? match[1] : `${formType}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      // ! [ERROR] Export failed
      console.error(err);
      openGeneralModal({
        title: "Export Failed",
        message: err.message || "Network error. Please check your connection.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setExporting(null);
    }
  };

  // [HANDLE] Trigger hidden file input for import
  const handleImportClick = (formType: "SF1") => {
    setImportingFor(formType);
    setImportResult(null);
    fileInputRef.current?.click();
  };

  // [HANDLE] Process imported file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !importingFor) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "csv"].includes(ext || "")) {
      openGeneralModal({
        title: "Invalid File",
        message: "Please upload a .xlsx or .csv file exported from the SF1 template.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
      return;
    }

    setImportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("sf1File", file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not import the file. Please check the format and try again.");

      const r: ImportResult = data.data?.results;
      setImportResult(r);
      await fetchSection();

      // * [SUCCESS] Import Successful
      openGeneralModal({
        title: "Import Successful",
        message:
          `${r.created} new student(s) added, ${r.updated} updated, ${r.enrolled} enrolled into your section.` +
          (r.errors.length ? `\n\n${r.errors.length} record(s) had errors and were skipped.` : ""),
        type: "success",
        confirmText: "Done",
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Import failed
      console.error(err);
      openGeneralModal({
        title: "Import Failed",
        message: err.message || "Network error during import.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setImportLoading(false);
      setImportingFor(null);
    }
  };

  // * [BREADCRUMBS] Adviser Class School Forms navigation
  const breadcrumbs = [
    { label: "Adviser Dashboard", path: "/adviser/dashboard" },
    { label: "School Forms", path: "/adviser/school-forms" },
    { label: section ? `Grade ${section.gradeLevel} — ${section.name}` : "Section", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  // [COMPUTE] Separate section-level and student-level forms
  const sectionLevelForms = section?.schoolForms.filter(f => SECTION_FORMS.includes(f.type)) ?? [];
  const studentLevelForms = section?.schoolForms.filter(f => STUDENT_FORMS.includes(f.type)) ?? [];

  return (
    <>
      {/* [HIDDEN] File input for SF1 import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* [MODAL] General */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
        isCancelable={generalModal.isCancelable}
      />

      {/* [LAYOUT] Adviser Page */}
      <PageLayout
        header={<Breadcrumbs items={breadcrumbs} title="School Forms" />}
      >
        {section ? (
          <div className="space-y-4">

            {/* [CARD] Section Info Header */}
            <ClassCard
              id={section.id}
              name={section.name}
              classSize={section.classSize}
              curriculum={section.curriculum}
              gradeLevel={section.gradeLevel}
            />

            {/* [SECTION] Section-level Forms — SF1, SF2, SF5 */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Section Forms
              </p>
              {sectionLevelForms.length === 0 ? (
                <EmptyState
                  title="No section forms available"
                  subtitle="SF1, SF2, and SF5 will appear here once created."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sectionLevelForms.map(form => (
                    <SchoolFormActionCard
                      key={form.id}
                      form={form}
                      sectionId={section.id}
                      sectionSchoolYear={section.schoolYear}
                      onExport={() => handleExport(form.type as any)}
                      onImport={form.type === "SF1" ? () => handleImportClick("SF1") : undefined}
                      exporting={exporting === form.type}
                      importing={importLoading && importingFor === form.type}
                      supportsImport={form.type === "SF1"}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* [SECTION] Student-level Forms — SF9, SF10 */}
            <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Student Forms
              </p>
              {studentLevelForms.length === 0 ? (
                <EmptyState
                  title="No student forms available"
                  subtitle="SF9 and SF10 will appear here once grades are recorded."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studentLevelForms.map(form => (
                    <SchoolFormActionCard
                      key={form.id}
                      form={form}
                      sectionId={section.id}
                      sectionSchoolYear={section.schoolYear}
                      onExport={() => handleExport(form.type as any)}
                      exporting={exporting === form.type}
                      importing={false}
                      supportsImport={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* [CARD] Import Error Details */}
            {importResult && importResult.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-roboto font-semibold text-amber-700 mb-2">
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
        ) : (
          // [EMPTY STATE] Section not found
          <div className="bg-[var(--color-bg-100)] rounded-lg p-8 text-center">
            <p className="text-sm font-roboto text-[var(--color-text-600)]">Section not found.</p>
            <button
              onClick={() => navigate("/adviser/school-forms")}
              className="mt-3 text-sm font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
            >
              ← Back to School Forms
            </button>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default AdviserClassSchoolForms;