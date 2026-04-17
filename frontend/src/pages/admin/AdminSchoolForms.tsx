/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

// [IMPORT] React
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

// [IMPORT] Constants, Types, Helpers
import { FORM_STATUS_BADGE, FORM_STATUS_LABELS } from "../../constants/index";
import { SectionOverview, GeneralModalConfig } from "../../types/index";
import { safeJson, getMissingInfo, sectionFormSummary } from "./../../helpers/index";
import PrimaryButton from "../../components/PrimaryButton";
import DashboardItem from "../../components/DashboardItem";
import SectionFormCard from "../../components/SectionFormCard";

const AdminSchoolForms = () => {
  const navigate = useNavigate();

  // [STATES] Data
  const [sections, setSections] = useState<SectionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // [STATES] List-view filters
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("grade-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [filterYear, setFilterYear] = useState<string>("All");
  const [showYearFilters, setShowYearFilters] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);

  const [filterGrade, setFilterGrade] = useState<string>("All");
  const [showGradeFilters, setShowGradeFilters] = useState(false);
  const gradeRef = useRef<HTMLDivElement>(null);

  // [STATES] Generate forms modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateYear, setGenerateYear] = useState("");

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false, title: "", message: "", type: "default",
    confirmText: "OK", isCancelable: true, onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) =>
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  const closeGeneralModal = () =>
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));

  // * [HANDLE] Fetch all sections with their forms
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const query = filterYear !== "All" ? `?schoolYear=${encodeURIComponent(filterYear)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-forms${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Failed to fetch sections");
      setSections(Array.isArray(data.data?.sections) ? data.data.sections : []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load School Forms",
        message: "We couldn't load school forms. Please check your connection and try again.",
        type: "error", confirmText: "Close", isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSections(); }, [filterYear]);

  // [EFFECT] Close all dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current  && !sortRef.current.contains(e.target as Node))  setShowSortFilters(false);
      if (yearRef.current  && !yearRef.current.contains(e.target as Node))  setShowYearFilters(false);
      if (gradeRef.current && !gradeRef.current.contains(e.target as Node)) setShowGradeFilters(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // * [HANDLE] Navigate to section detail page
  const handleSectionClick = (sectionId: number) => {
    navigate(`/admin/school-forms/section/${sectionId}`);
  };

  // * [HANDLE] Auto-generate forms for a school year
  const handleGenerate = async () => {
    if (!generateYear.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/school-forms/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ schoolYear: generateYear.trim() }),
        }
      );
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Generation failed");

      setShowGenerateModal(false);
      await fetchSections();
      openGeneralModal({
        title: "Forms Generated",
        message: `${data.data.created} form(s) created. ${data.data.skipped} already existed and were skipped.`,
        type: "success", isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      console.error(err);
      openGeneralModal({
        title: "Generation Failed",
        message: err.message || "Could not generate forms. Please try again.",
        type: "error", isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // [DERIVED] Unique school years and grade levels
  const availableYears  = [...new Set(sections.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
  const availableGrades = [...new Set(sections.map((s) => String(s.gradeLevel)))].sort();

// [HANDLE] Filter + sort (null-safe)
const filteredSections = sections
  .filter((s) => {
    const q = search.toLowerCase();

    // Safe adviser name
    const adviserName = s.adviser?.name?.toLowerCase() || "";

    return (
      s.name.toLowerCase().includes(q) ||   // section name
      adviserName.includes(q) ||             // adviser name safely
      s.schoolYear.includes(q)               // school year
    ) &&
    (filterYear === "All" || s.schoolYear === filterYear) &&
    (filterGrade === "All" || String(s.gradeLevel) === filterGrade);
  })
  .sort((a, b) => {
    switch (sortOption) {
      case "name-asc":   return a.name.localeCompare(b.name);
      case "name-desc":  return b.name.localeCompare(a.name);
      case "grade-asc":  return a.gradeLevel - b.gradeLevel;
      case "grade-desc": return b.gradeLevel - a.gradeLevel;
      default: return 0;
    }
  });

  const totalPages        = Math.ceil(filteredSections.length / itemsPerPage);
  const displayedSections = filteredSections.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePrevPage = () => setPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setPage((p) => Math.min(p + 1, totalPages));

  // [SUMMARY STATS]
  const totalSections   = sections.length;
  const incompleteSections = sections.filter((s) => getMissingInfo(s).length > 0).length;
  const approvedSections   = sections.filter((s) => sectionFormSummary(s.schoolForms) === "APPROVED" || sectionFormSummary(s.schoolForms) === "LOCKED").length;

  if (loading) return <Skeleton />;

  return (
    <div>
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

      {/* [MODAL] Generate Forms */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate School Forms"
        type="default"
        confirmText={submitting ? "Generating..." : "Generate"}
        onConfirm={handleGenerate}
        isCancelable={!submitting}
      >
        <div className="p-1 space-y-3">
          <p className="text-sm text-[var(--color-text-600)]">
            Auto-creates <strong>SF1</strong> and <strong>SF5</strong> for all sections in the given school
            year. Sections that already have a form of that type will be skipped.
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">
              School Year <span className="text-[var(--color-red-500)]">*</span>
            </label>
            <input
              type="text"
              value={generateYear}
              onChange={(e) => setGenerateYear(e.target.value)}
              placeholder="e.g. 2025 - 2026"
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
            />
          </div>
        </div>
      </Modal>

      <div className="py-10 px-4 space-y-4 relative">
        {/* [SECTION] Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[var(--color-text-800)] leading-tight">School Forms</h2>
            <p className="text-sm text-[var(--color-text-700)] mt-0.5 font-roboto">
              Manage and track SF1 and SF5 forms across all sections.
            </p>
          </div>
          <PrimaryButton text="Auto-Generate School Forms" iconSrc="/auto-generate-icon.svg" onClick={() => { setGenerateYear(""); setShowGenerateModal(true); }} />
        </div>

        {/* [SECTION] Overview */}
        <div className="bg-[var(--color-bg-100)] border-2 border-[var(--color-bg-300)]/60 rounded-xl px-5 py-6 gap-x-3 shadow-md">
          <h2 className="mb-3">Overview</h2>
          <div className="space-y-2">
            <DashboardItem iconSrc="/total-sections-icon.svg" text="Total Sections" value={totalSections} />
            <DashboardItem iconSrc="/check-icon.svg" text="Approved / Locked" value={approvedSections} color="#0066CC" />
            <DashboardItem iconSrc="/error-icon-white.svg" text="Needs Attention" value={incompleteSections} color="#E60000" />
          </div>
        </div>

        {/* [SECTION] Search & Filters */}
        <div className="bg-[var(--color-bg-100)] px-3 rounded-lg py-3 flex flex-wrap gap-2 md:gap-3 items-stretch w-full border border-[var(--color-bg-200)]">

          {/* [INPUT] Search */}
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="text"
              placeholder="Search by section or adviser..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-10 text-sm"
            />
          </div>

          {/* [DROPDOWN] School Year */}
          <div ref={yearRef} className="relative">
            <button
              onClick={() => setShowYearFilters(!showYearFilters)}
              className={`h-10 px-3 rounded-sm text-xs font-semibold transition-colors cursor-pointer ${
                filterYear !== "All"
                  ? "bg-[var(--color-primary-600)] text-[var(--color-text-50)]"
                  : "bg-[var(--color-bg-50)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-200)]"
              }`}
            >
              {filterYear === "All" ? "School Year" : filterYear}
            </button>
            {showYearFilters && (
              <div className="absolute left-0 mt-2 w-36 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50 max-h-48 overflow-y-auto">
                <button onClick={() => { setFilterYear("All"); setPage(1); setShowYearFilters(false); }}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${filterYear === "All" ? "bg-blue-100" : ""}`}>All Years</button>
                {availableYears.map((y) => (
                  <button key={y} onClick={() => { setFilterYear(y); setPage(1); setShowYearFilters(false); }}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${filterYear === y ? "bg-blue-100" : ""}`}>{y}</button>
                ))}
              </div>
            )}
          </div>

          {/* [DROPDOWN] Grade Level */}
          <div ref={gradeRef} className="relative">
            <button
              onClick={() => setShowGradeFilters(!showGradeFilters)}
              className={`h-10 px-3 rounded-sm text-xs font-semibold transition-colors cursor-pointer ${
                filterGrade !== "All"
                  ? "bg-[var(--color-primary-600)] text-[var(--color-text-50)]"
                  : "bg-[var(--color-bg-50)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-200)]"
              }`}
            >
              {filterGrade === "All" ? "Grade Level" : `Grade ${filterGrade}`}
            </button>
            {showGradeFilters && (
              <div className="absolute left-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50 max-h-48 overflow-y-auto">
                <button onClick={() => { setFilterGrade("All"); setPage(1); setShowGradeFilters(false); }}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${filterGrade === "All" ? "bg-blue-100" : ""}`}>All Grades</button>
                {availableGrades.map((g) => (
                  <button key={g} onClick={() => { setFilterGrade(g); setPage(1); setShowGradeFilters(false); }}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${filterGrade === g ? "bg-blue-100" : ""}`}>Grade {g}</button>
                ))}
              </div>
            )}
          </div>

          {/* [DROPDOWN] Sort */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setShowSortFilters(!showSortFilters)}
              className="flex items-center justify-center rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:bg-[var(--color-bg-200)]"
            >
              <img src="/sort-icon.svg" alt="Sort" className="size-4" />
            </button>
            {showSortFilters && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
                {([
                  { value: "grade-asc",  label: "Grade ↑" },
                  { value: "grade-desc", label: "Grade ↓" },
                  { value: "name-asc",   label: "Section Name ↑" },
                  { value: "name-desc",  label: "Section Name ↓" },
                ] as { value: typeof sortOption; label: string }[]).map((opt) => (
                  <button key={opt.value} onClick={() => { setSortOption(opt.value); setShowSortFilters(false); }}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === opt.value ? "bg-blue-100" : ""}`}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE: Cards ── */}
        <div className="flex flex-col gap-3 sm:hidden">
          {displayedSections.length === 0 ? (
            <EmptyState
              title="No sections found"
              subtitle={sections.length === 0 ? "No sections have been created yet." : "No sections match your current search or filters."}
              iconSrc="/no-data-icon.svg"
            />
          ) : (
            displayedSections.map((section) => (
              <SectionFormCard
                key={section.id}
                section={section}
                onClick={handleSectionClick}
              />
            ))
          )}
        </div>

        {/* ── DESKTOP: Table ── */}
        <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden border border-[var(--color-bg-200)]">
          <table className="w-full text-sm font-roboto">
            <thead>
              <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide bg-[var(--color-bg-50)]">
                <th className="px-4 py-3 text-left">Section</th>
                <th className="px-4 py-3 text-left">Grade</th>
                <th className="px-4 py-3 text-left">Adviser</th>
                <th className="px-4 py-3 text-left">School Year</th>
                <th className="px-4 py-3 text-left">Curriculum</th>
                <th className="px-4 py-3 text-left">Students</th>
                <th className="px-4 py-3 text-left">SF1</th>
                <th className="px-4 py-3 text-left">SF5</th>
                <th className="px-4 py-3 text-left">Issues</th>
              </tr>
            </thead>
            <tbody>
              {displayedSections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <EmptyState
                      title="No sections found"
                      subtitle={sections.length === 0 ? "No sections have been created yet." : "No sections match your current search or filters."}
                      iconSrc="/no-data-icon.svg"
                    />
                  </td>
                </tr>
              ) : (
                displayedSections.map((section) => {
                  const sf1     = section.schoolForms.find((f) => f.type === "SF1");
                  const sf5     = section.schoolForms.find((f) => f.type === "SF5");
                  const missing = getMissingInfo(section);
                  return (
                    <tr
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`border-b border-[var(--color-bg-200)] hover:bg-[var(--color-bg-50)] transition-colors cursor-pointer ${
                        missing.length > 0 ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-text-900)]">{section.name}</td>
                      <td className="px-4 py-3 text-[var(--color-text-700)]">Grade {section.gradeLevel}</td>
                      <td className="px-4 py-3 text-[var(--color-text-700)]">{section?.adviser?.name}</td>
                      <td className="px-4 py-3 font-mono text-[var(--color-text-600)] text-xs">{section.schoolYear}</td>
                      <td className="px-4 py-3 text-[var(--color-text-700)]">{section.curriculum}</td>
                      <td className={`px-4 py-3 font-medium ${section.enrollments.length === 0 ? "text-amber-600" : "text-[var(--color-text-700)]"}`}>
                        {section.enrollments.length}
                      </td>
                      <td className="px-4 py-3">
                        {sf1
                          ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[sf1.status]}`}>{FORM_STATUS_LABELS[sf1.status]}</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">Missing</span>}
                      </td>
                      <td className="px-4 py-3">
                        {sf5
                          ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[sf5.status]}`}>{FORM_STATUS_LABELS[sf5.status]}</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">Missing</span>}
                      </td>
                      <td className="px-4 py-3">
                        {missing.length > 0 ? (
                          <div className="flex items-center gap-1" title={missing.join(", ")}>
                            <span className="text-amber-500 text-sm">⚠</span>
                            <span className="text-xs text-amber-600 font-medium">{missing.length}</span>
                          </div>
                        ) : (
                          <span className="text-green-600 text-sm" title="All good">✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* [SECTION] Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-4">
            <button onClick={handlePrevPage} disabled={page === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${page === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"}`}>
              &lt;
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button key={num} onClick={() => setPage(num)}
                  className={`size-6 flex items-center justify-center rounded-full font-bold text-xs transition-all duration-150 ${num === page ? "size-7 bg-[var(--color-primary-500)] text-[var(--color-text-50)] scale-110" : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)]"}`}
                  aria-label={`Go to page ${num}`}>
                  {num}
                </button>
              ))}
            </div>
            <button onClick={handleNextPage} disabled={page === totalPages}
              className={`size-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${page === totalPages ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"}`}>
              &gt;
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminSchoolForms;