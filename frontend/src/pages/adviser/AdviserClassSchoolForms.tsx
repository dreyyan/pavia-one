/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import SearchBar from "../../components/toolbar/SearchBar";
import Dropdown from "../../components/toolbar/Dropdown";
import Pagination from "../../components/toolbar/Pagination";
import Breadcrumbs from "../../components/toolbar/Breadcrumbs";
import ClassCard from "../../components/cards/class/ClassCard";
import SchoolFormActionCard from "../../components/cards/school_form/SchoolFormActionCard";
import PageLayout from "../../components/layouts/PageLayout";

// [IMPORT] Constants, Helpers & Types
import { SECTION_FORMS, STUDENT_FORMS, FORM_PERMISSIONS } from "../../constants";
import { getVisiblePages } from "../../helpers/index";
import { GeneralModalConfig, SchoolFormStatus, SectionInfo, ImportResult, SectionFormUI, FormType } from "../../types";

// ? [INTERFACE] Student with SF9 data only (SF5 is section-level, never per student)
interface StudentSF9 {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  sex?: string;
  enrollmentStatus: string;
  sf9: Record<number, { id: number; q1Ready: boolean; q2Ready: boolean; q3Ready: boolean; q4Ready: boolean; }>;
  sf9Status: "COMPLETE" | "PARTIAL" | "PENDING";
  sf10Status: "COMPLETE" | "PENDING";
  generalAverage: number | null;
}

type SF9SortOption = "name-asc" | "name-desc" | "lrn-asc" | "lrn-desc" | "status-asc" | "status-desc";

const AdviserClassSchoolForms = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { setShowTokenExpiredModal } = useAuth();

  // [STATES] Entities
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [students, setStudents] = useState<StudentSF9[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Import / Export
  const [exporting, setExporting] = useState<string | null>(null);
  const [importingFor, setImportingFor] = useState<"SF1" | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // [STATES] SF9 Search, Sort, and Pagination
  const [sf9Search, setSf9Search] = useState("");
  const [sf9SortOption, setSf9SortOption] = useState<SF9SortOption>("name-asc");
  const [sf9ActiveDropdown, setSf9ActiveDropdown] = useState<"sort" | null>(null);
  const [sf9Page, setSf9Page] = useState(1);
  const sf9ItemsPerPage = 10;

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

  // * [HANDLE] Fetch Section with School Forms and Student SF9 Data
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
      if (!data.success) throw new Error(data.message);

      const raw = data.data.section;
      const studentsData: StudentSF9[] = data.data.students ?? [];

      // [COMPUTE] Male / female counts from student list
      let maleCount = 0;
      let femaleCount = 0;
      studentsData.forEach(s => {
        const sex = s.sex?.toUpperCase();
        if (sex === "MALE") maleCount++;
        else if (sex === "FEMALE") femaleCount++;
      });

      setStudents(studentsData);
      setSection({
        id: raw.id,
        name: raw.name,
        gradeLevel: raw.gradeLevel,
        schoolYear: raw.schoolYear,
        color: raw.color,
        curriculum: raw.curriculum,
        classSize: raw.classSize ?? studentsData.length,
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
      // ! [ERROR] Fetching section failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Section",
        message: "We couldn't load the section. Please check your connection and try again.",
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

  // * [HANDLE] Export School Form (section-level or per-student SF9)
  const handleExport = async (formType: string, studentId?: number) => {
    const exportKey = studentId ? `SF9-${studentId}` : formType;
    setExporting(exportKey);

    try {
      const token = localStorage.getItem("token");

      const endpointMap: Record<string, string> = {
        SF1:  "/api/adviser/sf1/export",
        SF2:  "/api/adviser/sf2/export",
        SF5:  "/api/adviser/sf5/export",
        SF9:  "/api/adviser/sf9/export",
        SF10: "/api/adviser/sf10/export",
      };

      // [COMPUTE] Per-student SF9 uses a dedicated endpoint with studentId param
      const endpoint = studentId
        ? `/api/adviser/sf9/export?studentId=${studentId}`
        : endpointMap[formType];

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const contentType = res.headers.get("content-type") || "";

      // [CASE] JSON response — warning or error
      if (contentType.includes("application/json")) {
        const errData = await res.json();

        // ! [ERROR] Real error — no export generated
        if (!res.ok && !errData.data) {
          openGeneralModal({
            title: "Export Failed",
            message: errData.message || "An error occurred while generating the file.",
            type: "error",
            confirmText: "Close",
            onConfirm: () => closeGeneralModal(),
          });
          return;
        }

        // ⚠ [WARNING] SF1 incomplete students
        if (Array.isArray(errData.data)) {
          const names = errData.data
            .slice(0, 5)
            .map(
              (s: any) =>
                `• ${s.name}: ${(s.missing ?? s.missingFields ?? []).join(", ")}`
            )
            .join("\n");

          const more =
            errData.data.length > 5
              ? `\n...and ${errData.data.length - 5} more.`
              : "";

          openGeneralModal({
            title: "Incomplete SF1 Data",
            message: `Some students have missing information:\n\n${names}${more}\n\nExport will still proceed.`,
            type: "error",
            confirmText: "OK",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });

          return;
        }
      }

      // ! [ERROR] Non-JSON failure
      if (!res.ok) throw new Error("Export failed");

      // * [SUCCESS] Stream file download
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
        message: err.message || "Network error. Please try again.",
        type: "error",
        confirmText: "Close",
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setExporting(null);
    }
  };

  // [HANDLE] Trigger hidden file input for SF1 import
  const handleImportClick = () => {
    setImportingFor("SF1");
    setImportResult(null);
    fileInputRef.current?.click();
  };

  // [HANDLE] Process imported file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

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
      if (!data.success) throw new Error(data.message || "Import failed");

      const r: ImportResult = data.data?.results;
      setImportResult(r);
      await fetchSection();

      // * [SUCCESS] Import successful
      openGeneralModal({
        title: "Import Successful",
        message:
          `${r.created} new student(s) added, ${r.updated} updated, ${r.enrolled} enrolled.` +
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

  // [COMPUTE] Section-level forms: SF1, SF2, SF5, SF10 — from section.schoolForms
  const sectionLevelForms: SectionFormUI[] =
    SECTION_FORMS.map((type) => {
      const existing = section?.schoolForms?.find((f) => f.type === type);
      return (
        existing ?? {
          id: `virtual-${type}`,
          type,
          status: "VIRTUAL",
          schoolYear: section?.schoolYear ?? "",
          generatedAt: undefined,
          submittedAt: undefined,
          isVirtual: true,
        }
      );
    });

  // [COMPUTE] SF5 is section-level only — never per student
  const sf5Form = section?.schoolForms?.find(f => f.type === "SF5") ?? null;

  // [COMPUTE] SF9 aggregate export forms — section-wide export of all student SF9s
  const studentLevelForms = section?.schoolForms?.filter(f => STUDENT_FORMS.includes(f.type)) ?? [];

  // * [COMPUTE] Filtered & sorted SF9 students
  const filteredSF9Students = students
    .filter(s => {
      const fullName = `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName}` : ""}`;
      return (
        fullName.toLowerCase().includes(sf9Search.toLowerCase()) ||
        s.lrn.includes(sf9Search)
      );
    })
    .sort((a, b) => {
      const aName = `${a.lastName} ${a.firstName}`;
      const bName = `${b.lastName} ${b.firstName}`;
      const statusOrder = { COMPLETE: 0, PARTIAL: 1, PENDING: 2 };
      switch (sf9SortOption) {
        case "name-asc":    return aName.localeCompare(bName);
        case "name-desc":   return bName.localeCompare(aName);
        case "lrn-asc":     return a.lrn.localeCompare(b.lrn);
        case "lrn-desc":    return b.lrn.localeCompare(a.lrn);
        case "status-asc":  return statusOrder[a.sf9Status] - statusOrder[b.sf9Status];
        case "status-desc": return statusOrder[b.sf9Status] - statusOrder[a.sf9Status];
        default: return 0;
      }
    });

  const sf9TotalPages = Math.ceil(filteredSF9Students.length / sf9ItemsPerPage);
  const displayedSF9Students = filteredSF9Students.slice(
    (sf9Page - 1) * sf9ItemsPerPage,
    sf9Page * sf9ItemsPerPage
  );

  // [DERIVED] SF9 status badge style helper
  const getSF9BadgeStyle = (status: StudentSF9["sf9Status"]) => {
    if (status === "COMPLETE") return "bg-[var(--color-accent-100)] text-[var(--color-accent-700)]";
    if (status === "PARTIAL")  return "bg-amber-100 text-amber-700";
    return "bg-[var(--color-bg-200)] text-[var(--color-text-600)]";
  };

  const getSF10BadgeStyle = (status: StudentSF9["sf10Status"]) =>
    status === "COMPLETE"
      ? "bg-[var(--color-accent-100)] text-[var(--color-accent-700)]"
      : "bg-[var(--color-bg-200)] text-[var(--color-text-600)]";

  // [DERIVED] Section label
  const sectionLabel = section ? `(${section.gradeLevel} — ${section.name})` : "Class";

  // * [BREADCRUMBS] Adviser Class School Forms navigation
  const breadcrumbs = [
    { label: "School Forms", path: "/adviser/school-forms" },
    { label: "Forms", path: null },
  ];

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

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
        header={<Breadcrumbs items={breadcrumbs} title={`School Forms ${sectionLabel}`} />}
      >
        {section ? (
          <div className="space-y-4">

            {/* [COMPONENT] Class Card */}
            <ClassCard {...section} />

            {/* [CARD] Section-Level Forms — SF1, SF2, SF5, SF10 */}
            <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Section Forms
              </p>

              {sectionLevelForms.length === 0 ? (
                <EmptyState
                  title="No section forms available"
                  subtitle="Section forms will appear here once generated."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sectionLevelForms.map(form => (
                    <SchoolFormActionCard
                      key={form.id}
                      form={form}
                      sectionSchoolYear={section.schoolYear}
                      onExport={() => handleExport(form.type)}
                      onImport={form.type === "SF1" ? handleImportClick : undefined}
                      exporting={exporting === form.type}
                      importing={importLoading && importingFor === "SF1" && form.type === "SF1"}
                      supportsImport={FORM_PERMISSIONS[form.type as FormType]?.import ?? false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* [CARD] SF9 Student Grades — per-student status overview with search, sort, and pagination */}
            <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                SF9 Student Grades
              </p>

              {students.length === 0 ? (
                <EmptyState
                  title="No students found"
                  subtitle="Import SF1 to generate student SF9 records."
                />
              ) : (
                <>
                  {/* [TOOLBAR] Search + Sort */}
                  <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] px-3 py-3 rounded-md flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
                    <div className="flex items-stretch gap-2 md:gap-4 w-full">

                      {/* Search */}
                      <div className="w-full sm:w-64 md:w-80 lg:w-96">
                        <SearchBar
                          value={sf9Search}
                          placeholder="Search by name or LRN"
                          onChange={setSf9Search}
                          onResetPage={() => setSf9Page(1)}
                        />
                      </div>

                      {/* Sort */}
                      <div className="flex gap-x-2 ml-auto shrink-0">
                        <Dropdown
                          icon="/sort.svg"
                          label="Sort"
                          isOpen={sf9ActiveDropdown === "sort"}
                          onToggle={() =>
                            setSf9ActiveDropdown(sf9ActiveDropdown === "sort" ? null : "sort")
                          }
                          selected={sf9SortOption}
                          onSelect={(value) => {
                            setSf9SortOption(value as SF9SortOption);
                            setSf9Page(1);
                          }}
                          options={[
                            { label: "Name (A → Z)",      value: "name-asc" },
                            { label: "Name (Z → A)",      value: "name-desc" },
                            { label: "LRN ↑",             value: "lrn-asc" },
                            { label: "LRN ↓",             value: "lrn-desc" },
                            { label: "SF9 Status (Best)", value: "status-asc" },
                            { label: "SF9 Status (Worst)",value: "status-desc" },
                          ]}
                        />
                      </div>

                    </div>
                  </div>

                  {/* [TABLE] Mobile — card grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-3">
                    {displayedSF9Students.length === 0 ? (
                      <div className="sm:col-span-2 flex justify-center">
                        <EmptyState
                          title="No students found"
                          subtitle="No students match your current search."
                        />
                      </div>
                    ) : (
                      displayedSF9Students.map(student => {
                        const hasSF9 = Object.keys(student.sf9 ?? {}).length > 0;
                        const exportKey = `SF9-${student.id}`;

                        return (
                          <div
                            key={student.id}
                            className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex flex-col gap-2"
                          >
                            {/* [TEXT] Name + LRN */}
                            <div
                              className="min-w-0 cursor-pointer"
                              onClick={() =>
                                navigate(`/adviser/classes/${sectionId}/grades/${student.id}`)
                              }
                            >
                              <p className="font-roboto font-semibold text-sm text-[var(--color-primary-600)] hover:underline truncate">
                                {student.lastName}, {student.firstName}
                                {student.middleName ? ` ${student.middleName}` : ""}
                              </p>
                              <p className="text-xs font-mono text-[var(--color-text-500)] mt-0.5">
                                LRN {student.lrn}
                              </p>
                            </div>

                            {/* [BADGES + ACTION] Status pills + export */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getSF9BadgeStyle(hasSF9 ? student.sf9Status : "PENDING")}`}>
                                  SF9: {hasSF9 ? student.sf9Status : "PENDING"}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getSF10BadgeStyle(student.sf10Status)}`}>
                                  SF10: {student.sf10Status}
                                </span>
                              </div>

                              {/* [ACTION] Per-student SF9 export */}
                              <button
                                onClick={() => handleExport("SF9", student.id)}
                                disabled={exporting === exportKey}
                                className="flex items-center gap-1 text-xs font-roboto font-semibold px-2.5 py-1 rounded-md bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                              >
                                <img src="/export.svg" alt="" className="size-3.5" />
                                {exporting === exportKey ? "Exporting..." : "Export SF9"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* [TABLE] Desktop */}
                  <div className="hidden md:block bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md overflow-x-auto">
                    {displayedSF9Students.length === 0 ? (
                      <div className="px-3 py-4">
                        <EmptyState
                          title="No students found"
                          subtitle="No students match your current search."
                        />
                      </div>
                    ) : (
                      <table className="min-w-full border-separate border-spacing-y-2 px-3 py-2">
                        <thead>
                          <tr className="text-left">
                            <th className="table-header">Name</th>
                            <th className="table-header">LRN</th>
                            <th className="table-header text-center">SF9 Status</th>
                            <th className="table-header text-center">SF10 Status</th>
                            <th className="table-header text-center">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {displayedSF9Students.map(student => {
                            const hasSF9 = Object.keys(student.sf9 ?? {}).length > 0;
                            const exportKey = `SF9-${student.id}`;

                            return (
                              <tr
                                key={student.id}
                                className="bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)] transition"
                              >
                                {/* Name */}
                                <td
                                  onClick={() =>
                                    navigate(`/adviser/classes/${sectionId}/grades/${student.id}`)
                                  }
                                  className="table-cell table-text table-text-link cursor-pointer hover:underline"
                                >
                                  {student.lastName}, {student.firstName}
                                  {student.middleName ? ` ${student.middleName}` : ""}
                                </td>

                                {/* LRN */}
                                <td className="table-cell table-text table-text-default font-mono">
                                  {student.lrn}
                                </td>

                                {/* SF9 Status */}
                                <td className="table-cell table-text text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getSF9BadgeStyle(hasSF9 ? student.sf9Status : "PENDING")}`}>
                                    {hasSF9 ? student.sf9Status : "PENDING"}
                                  </span>
                                </td>

                                {/* SF10 Status */}
                                <td className="table-cell table-text text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getSF10BadgeStyle(student.sf10Status)}`}>
                                    {student.sf10Status}
                                  </span>
                                </td>

                                {/* [ACTION] Per-student SF9 export */}
                                <td className="table-cell table-text text-center">
                                  <button
                                    onClick={() => handleExport("SF9", student.id)}
                                    disabled={exporting === exportKey}
                                    className="inline-flex items-center gap-1.5 text-xs font-roboto font-semibold px-3 py-1.5 rounded-md bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    <img src="/export.svg" alt="" className="size-3.5" />
                                    {exporting === exportKey ? "Exporting..." : "Export SF9"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* [PAGINATION] SF9 Students */}
                  <Pagination
                    page={sf9Page}
                    totalPages={sf9TotalPages}
                    onPageChange={setSf9Page}
                    getVisiblePages={getVisiblePages}
                  />
                </>
              )}
            </div>

            {/* [CARD] SF5 Section Summary — section-level only, never per student */}
            <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                SF5 Section Summary
              </p>
              {sf5Form ? (
                <SchoolFormActionCard
                  form={sf5Form}
                  sectionSchoolYear={section.schoolYear}
                  onExport={() => handleExport("SF5")}
                  exporting={exporting === "SF5"}
                  importing={false}
                  supportsImport={false}
                />
              ) : (
                <p className="text-sm font-roboto text-[var(--color-text-600)]">
                  SF5 has not been generated yet for this section.
                </p>
              )}
            </div>

            {/* [CARD] SF9 / SF10 Export Forms — section-wide export of all student data */}
            {studentLevelForms.length > 0 && (
              <div className="bg-[var(--color-bg-100)] px-3 py-4 rounded-lg space-y-3">
                <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                  Student Form Exports
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studentLevelForms.map(form => (
                    <SchoolFormActionCard
                      key={form.id}
                      form={form}
                      sectionSchoolYear={section.schoolYear}
                      onExport={() => handleExport(form.type)}
                      exporting={exporting === form.type}
                      importing={false}
                      supportsImport={false}
                    />
                  ))}
                </div>
              </div>
            )}

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