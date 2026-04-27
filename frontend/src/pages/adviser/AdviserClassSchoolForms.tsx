/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import PageLayout from "../../components/layouts/PageLayout";
import ClassCard from "../../components/cards/class/ClassCard";
import SchoolFormActionCard from "../../components/cards/school_form/SchoolFormActionCard";

// [IMPORT] Helpers, Constants & Types
import {
  GeneralModalConfig,
  SchoolFormStatus,
  SectionInfo,
  ImportResult,
} from "../../types";

import {
  SECTION_FORMS,
  STUDENT_FORMS,
  FORM_PERMISSIONS,
} from "../../constants";

const AdviserClassSchoolForms = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES]
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState<string | null>(null);
  const [importingFor, setImportingFor] = useState<"SF1" | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // [MODAL]
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: false,
    onConfirm: () => {},
  });

  const openGeneralModal = (
    config: Partial<Omit<GeneralModalConfig, "isOpen">>
  ) => {
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ? [GET] Fetch Section
const fetchSection = async () => {
  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/adviser/forms/section/${sectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 401) {
      setShowTokenExpiredModal(true);
      return;
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const raw = data.data.section;
    const studentsData = data.data.students ?? [];

    // ✅ IMPORTANT: compute from studentsData (NOT state)
    let maleCount = 0;
    let femaleCount = 0;

    studentsData.forEach((student: any) => {
      const sex = student.sex?.toUpperCase();
      if (sex === "MALE") maleCount++;
      else if (sex === "FEMALE") femaleCount++;
    });

    // ✅ update BOTH states properly
    setStudents(studentsData);

    setSection({
      id: raw.id,
      name: raw.name,
      gradeLevel: raw.gradeLevel,
      schoolYear: raw.schoolYear,
      color: raw.color,
      curriculum: raw.curriculum,

      classSize: raw.classSize ?? studentsData.length ?? 0,

      maleCount,
      femaleCount,

      schoolForms: (raw.schoolForms ?? []).map((f: any) => ({
        id: f.id,
        type: f.type,
        status: f.status as SchoolFormStatus,
        schoolYear: f.schoolYear,
        generatedAt: f.generatedAt ?? undefined,
        submittedAt: f.submittedAt ?? undefined,
      })),
    });
  } catch (err) {
    console.error(err);
    openGeneralModal({
      title: "Unable to Load Section",
      message: "We couldn't load the section. Please try again.",
      type: "error",
      confirmText: "Close",
      onConfirm: closeGeneralModal,
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchSection();
  }, [sectionId]);

  // * [EXPORT]
  const handleExport = async (formType: string) => {
    setExporting(formType);

    try {
      const token = localStorage.getItem("token");

      const endpointMap: Record<string, string> = {
        SF1: "/api/adviser/sf1/export",
        SF2: "/api/adviser/sf2/export",
        SF5: "/api/adviser/sf5/export",
        SF9: "/api/adviser/sf9/export",
        SF10: "/api/adviser/sf10/export",
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpointMap[formType]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${formType}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err: any) {
      openGeneralModal({
        title: "Export Failed",
        message: err.message,
        type: "error",
        confirmText: "Close",
        onConfirm: closeGeneralModal,
      });
    } finally {
      setExporting(null);
    }
  };

  // * [IMPORT]
  const handleImportClick = () => {
    setImportingFor("SF1");
    setImportResult(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file) return;

    setImportLoading(true);

    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("sf1File", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/adviser/sf1/import`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setImportResult(data.data.results);
      await fetchSection();

      openGeneralModal({
        title: "Import Successful",
        message: "SF1 imported successfully.",
        type: "success",
        confirmText: "OK",
        onConfirm: closeGeneralModal,
      });
    } catch (err: any) {
      openGeneralModal({
        title: "Import Failed",
        message: err.message,
        type: "error",
        confirmText: "Close",
        onConfirm: closeGeneralModal,
      });
    } finally {
      setImportLoading(false);
      setImportingFor(null);
    }
  };

  // [SAFE COMPUTE]
  const sectionLevelForms =
    section?.schoolForms?.filter((f) => SECTION_FORMS.includes(f.type)) ?? [];

  const studentLevelForms =
    section?.schoolForms?.filter((f) => STUDENT_FORMS.includes(f.type)) ?? [];

  const sectionLabel = section
    ? `${section.gradeLevel} — ${section.name}`
    : "Class";

  const breadcrumbs = [
    { label: "School Forms", path: "/adviser/school-forms" },
    { label: sectionLabel, path: `/adviser/classes/${sectionId}` },
    { label: "Forms", path: null },
  ];

  if (loading) return <Skeleton />;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
      />

      <PageLayout
        header={
          <Breadcrumbs
            title={`School Forms (${sectionLabel})`}
            items={breadcrumbs}
          />
        }
      >
        {section ? (
          <div className="space-y-4">
            <ClassCard {...section} />

            {/* Section Forms */}
            <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
              <span className="form-section-title block">Section Forms</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sectionLevelForms.length === 0 ? (
                  <EmptyState
                    title="No section forms available"
                    subtitle="Section forms will appear here once generated."
                  />
                ) : (
                  sectionLevelForms.map((form) => (
                    <SchoolFormActionCard
                      key={form.id}
                      form={form}
                      sectionSchoolYear={section.schoolYear}
                      onExport={() => handleExport(form.type)}
                      onImport={
                        form.type === "SF1" ? handleImportClick : undefined
                      }
                      exporting={exporting === form.type}
                      importing={importLoading && importingFor === form.type}
                      supportsImport={
                        FORM_PERMISSIONS[form.type]?.import ?? false
                      }
                    />
                  ))
                )}
              </div>
            </div>

            {/* Student Forms */}
            <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
              <span className="form-section-title block">Student Forms</span>

              {/* [SF9 STATUS PREVIEW] */}
              <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
                <span className="form-section-title block">SF9 Student Grades</span>

                <div className="grid grid-cols-1 gap-3">
                  {students.length === 0 ? (
                    <EmptyState
                      title="No students found"
                      subtitle="Import SF1 to generate student SF9 records."
                    />
                  ) : (
                    students.map((student: any) => (
                      <div
                        key={student.id}
                        className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-sm">
                            {student.lastName}, {student.firstName}
                          </p>

                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-bg-200)]">
                            SF9: {student.sf9Status}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--color-text-600)] mt-1">
                          SF10: {student.sf10Status} • SF5: {student.sf5Status}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studentLevelForms.length === 0 ? (
                  <EmptyState
                    title="No student forms available"
                    subtitle="Student forms will appear here once generated."
                  />
                ) : (
                  studentLevelForms.map((form) => (
                    <SchoolFormActionCard
                      key={form.id}
                      form={form}
                      sectionSchoolYear={section.schoolYear}
                      onExport={() => handleExport(form.type)}
                      exporting={exporting === form.type}
                      importing={false}
                      supportsImport={false}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Section not found" subtitle="" />
        )}
      </PageLayout>
    </>
  );
};

export default AdviserClassSchoolForms;