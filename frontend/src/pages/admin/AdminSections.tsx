/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";
import SectionCard from "../../components/SectionCard";

// [IMPORT] Constants & Types
import { GRADE_LEVEL_OPTIONS, CURRICULUM_OPTIONS } from "../../constants";
import type { GeneralModalConfig, Section, SectionFormData } from "../../types";
import { SectionFormModal } from "../../components/forms/SectionFormModal";
import EmptyState from "../../components/EmptyState";
import SecondaryButton from "../../components/SecondaryButton";

const EMPTY_FORM: SectionFormData = {
  name: "",
  gradeLevel: "",
  schoolYear: "",
  curriculum: "",
  learningModality: "Face to Face",
  room: "",
  color: "",
  adviserId: "",
  adviserName: "",
};

const AdminSections = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES] Entities
  const [sections, setSections] = useState<Section[]>([]);
  const [advisers, setAdvisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [adviserSearch, setAdviserSearch] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("name-asc");
  const filterRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "grade" | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<string | "All">("All");

  // [STATES] Section Form Modal
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<SectionFormData>(EMPTY_FORM);

  // [STATES] Auto-Generate Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateYear, setGenerateYear]           = useState("");
  const [generating, setGenerating]               = useState(false);
  const [generateError, setGenerateError]         = useState("");

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: true,
    onConfirm: () => {},
  });

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // * [HANDLE] Fetch Sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setShowTokenExpiredModal(true); return; }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch sections");
      const list = data.data?.data;
      setSections(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Sections",
        message: "We couldn't load your sections at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  // * [FETCH] Advisers
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Advisers",
        message: "We couldn't load the advisers at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setAdvisers([]);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchAdvisers();
  }, []);

  // [HANDLE] Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // * [HANDLE] Open create modal
  const handleAddSection = () => {
    setFormData(EMPTY_FORM);
    setAdviserSearch("");
    setIsEditMode(false);
    setFormError("");
    setShowSectionModal(true);
  };

  // * [HANDLE] Submit form (create or update)
  const handleSubmit = async () => {
    const rawYear = (formData.schoolYear || "").trim();
    const yearMatch = rawYear.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (!yearMatch) {
      setFormError('School year must be in "YYYY - YYYY" format (e.g. 2024 - 2025)');
      return;
    }
    const normalizedSchoolYear = `${yearMatch[1]} - ${yearMatch[2]}`;

    const dataToSubmit = {
      ...(isEditMode && { id: formData.id }),
      name: formData.name.trim(),
      // adviser is optional — only include if actually set
      ...(formData.adviserId ? { adviserId: formData.adviserId } : {}),
      gradeLevel: Number(formData.gradeLevel),
      schoolYear: normalizedSchoolYear,
      curriculum: formData.curriculum,
      learningModality: formData.learningModality,
      room: formData.room || null,
      color: formData.color || null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/sections`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        await fetchSections();
        setShowSectionModal(false);
        setAdviserSearch("");
        openGeneralModal({
          title: "Section Updated",
          message: `"${formData.name}" has been updated successfully.`,
          type: "success",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      } else {
        if (!data.data?.created) {
          const reason = data.data?.failed?.[0]?.message || "The section could not be created.";
          setShowSectionModal(false);
          setAdviserSearch("");
          openGeneralModal({
            title: "Section Not Created",
            message: `We couldn't create the section. ${reason}`,
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
          return;
        }
        await fetchSections();
        setShowSectionModal(false);
        setAdviserSearch("");
        openGeneralModal({
          title: "Section Created",
          message: `"${formData.name}" has been created successfully.`,
          type: "success",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      }
    } catch (err: any) {
      console.error(err);
      setShowSectionModal(false);
      setAdviserSearch("");
      openGeneralModal({
        title: isEditMode ? "Unable to Update Section" : "Unable to Create Section",
        message: "Something went wrong while saving the section. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Auto-generate all sections for a school year
  const handleGenerate = async () => {
    const rawYear = generateYear.trim();
    const yearMatch = rawYear.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (!yearMatch) {
      setGenerateError('School year must be in "YYYY - YYYY" format (e.g. 2025 - 2026)');
      return;
    }
    const normalizedYear = `${yearMatch[1]} - ${yearMatch[2]}`;

    setGenerating(true);
    setGenerateError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          schoolYear: normalizedYear,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Generation failed");

      const { created, skipped } = data.data;
      setShowGenerateModal(false);
      setGenerateYear("");
      await fetchSections();
      openGeneralModal({
        title: "Sections Generated",
        message: `${created.length} section(s) created across ${CURRICULUM_OPTIONS.length} curricula × 4 grade levels. ${skipped.length} already existed and were skipped.`,
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      console.error(err);
      setGenerateError(err.message || "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // [HANDLE] Sorting and Searching
  const filteredSections = sections
    .filter(s =>
      (
        (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
        (s.curriculum && s.curriculum.toLowerCase().includes(search.toLowerCase())) ||
        (s.schoolYear && s.schoolYear.includes(search))
      ) &&
      (selectedGrade === "All" || String(s.gradeLevel) === selectedGrade)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":   return a.name.localeCompare(b.name);
        case "name-desc":  return b.name.localeCompare(a.name);
        case "grade-asc":  return a.gradeLevel - b.gradeLevel;
        case "grade-desc": return b.gradeLevel - a.gradeLevel;
        default: return 0;
      }
    });

  // [PAGINATION]
  const totalPages        = Math.ceil(filteredSections.length / itemsPerPage);
  const displayedSections = filteredSections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage    = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage    = () => setPage(prev => Math.min(prev + 1, totalPages));

  // [BREADCRUMBS]
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Sections", path: null },
  ];

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

      {/* [MODAL] Section Form */}
      <SectionFormModal
        isOpen={showSectionModal}
        title={isEditMode ? "Edit Section" : "Create Section"}
        onClose={() => setShowSectionModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        advisers={advisers}
        adviserSearch={adviserSearch}
        setAdviserSearch={setAdviserSearch}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
        isEditMode={isEditMode}
      />

      {/* [MODAL] Auto-Generate Sections */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setGenerateError(""); setGenerateYear(""); }}
        title="Auto-Generate All Sections"
        type="default"
        confirmText={generating ? "Generating..." : "Generate"}
        onConfirm={handleGenerate}
        isCancelable={!generating}
      >
        <div className="p-1 space-y-4">
          {/* Description */}
          <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-lg p-3 space-y-2">
            <p className="text-sm text-[var(--color-text-700)]">
              This will create <strong>one section per grade level × curriculum</strong> combination
              for the school year you specify — up to <strong>20 sections</strong> in total.
              Sections that already exist will be skipped.
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs text-[var(--color-text-500)]">
              <div>
                <p className="font-semibold text-[var(--color-text-700)] mb-0.5">Grade Levels</p>
                {["7", "8", "9", "10"].map(g => <p key={g}>Grade {g}</p>)}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-700)] mb-0.5">Curricula</p>
                {CURRICULUM_OPTIONS.map(c => <p key={c.value}>{c.label}</p>)}
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-400)] italic">
              No adviser will be assigned — you can assign them afterwards.
            </p>
          </div>

          {/* School Year */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">
              School Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={generateYear}
              onChange={(e) => { setGenerateYear(e.target.value); setGenerateError(""); }}
              placeholder="e.g. 2025 - 2026"
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
            />
          </div>

          {/* Error */}
          {generateError && (
            <p className="text-xs text-red-600 font-medium">{generateError}</p>
          )}
        </div>
      </Modal>

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">Sections</h2>
          <nav className="font-roboto text-sm text-[var(--color-text-700)]">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx}>
                {crumb.path ? (
                  <span className="cursor-pointer hover:underline" onClick={() => navigate(crumb.path!)}>{crumb.label}</span>
                ) : (
                  <span className="font-medium text-[var(--color-text-900)]">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && " / "}
              </span>
            ))}
          </nav>
        </div>

        {/* [SECTION] Search & Filters */}
        <div className="bg-[var(--color-bg-100)] px-3 rounded-lg py-4 flex md:flex-row gap-2 md:gap-4 items-stretch w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, curriculum, or school year..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
            />
          </div>

          {/* [DROPDOWN] Sort Filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "sort" ? null : "sort")}
              className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
            >
              <img src="/sort-icon.svg" alt="Sort" className="size-4" />
            </button>
            {activeDropdown === "sort" && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
                <button onClick={() => { setSortOption("name-asc"); setActiveDropdown(null); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}>Name ↑</button>
                <button onClick={() => { setSortOption("name-desc"); setActiveDropdown(null); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}>Name ↓</button>
                <button onClick={() => { setSortOption("grade-asc"); setActiveDropdown(null); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "grade-asc" ? "bg-blue-100" : ""}`}>Grade ↑</button>
                <button onClick={() => { setSortOption("grade-desc"); setActiveDropdown(null); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "grade-desc" ? "bg-blue-100" : ""}`}>Grade ↓</button>
              </div>
            )}
          </div>

          {/* [DROPDOWN] Grade Filter */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "grade" ? null : "grade")}
              className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
            >
              <img src="/filter-icon.svg" alt="Grade Filter" className="size-4" />
            </button>
            {activeDropdown === "grade" && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50 max-h-48 overflow-y-auto">
                <button onClick={() => { setSelectedGrade("All"); setPage(1); setActiveDropdown(null); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === "All" ? "bg-blue-100" : ""}`}>All</button>
                {GRADE_LEVEL_OPTIONS.map(g => (
                  <button key={g} onClick={() => { setSelectedGrade(g); setPage(1); setActiveDropdown(null); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === g ? "bg-blue-100" : ""}`}>Grade {g}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* [SECTION] Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            text="Add Section"
            iconSrc="/add-icon.svg"
            onClick={handleAddSection}
          />
          <SecondaryButton
            text="Auto-Generate Sections"
            iconSrc="/auto-generate-icon.svg"
            onClick={() => { setGenerateYear(""); setGenerateError(""); setShowGenerateModal(true); }}
          />
        </div>

        {/* [CARDS] Sections — Mobile View */}
        <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {!loading && (
            sections.length === 0 ? (
              <EmptyState
                title="No sections found"
                subtitle="You currently have no sections. Use 'Auto-Generate Sections' to create all sections at once."
                iconSrc="/no-data-icon.svg"
              />
            ) : displayedSections.length === 0 ? (
              <EmptyState
                title="No sections found"
                subtitle="No sections match your current filters or search. Try adjusting your criteria."
                iconSrc="/no-data-icon.svg"
              />
            ) : null
          )}
          {displayedSections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}
        </div>

        {/* [TABLE] Sections — Desktop View */}
        <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden">
          <table className="w-full text-sm font-roboto">
            <thead>
              <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Section</th>
                <th className="px-4 py-3 text-left">Grade</th>
                <th className="px-4 py-3 text-left">School Year</th>
                <th className="px-4 py-3 text-left">Curriculum</th>
                <th className="px-4 py-3 text-left">Adviser</th>
                <th className="px-4 py-3 text-left">Students</th>
              </tr>
            </thead>
            <tbody>
              {displayedSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-600)]">No sections found.</td>
                </tr>
              ) : (
                displayedSections.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--color-bg-200)] hover:bg-[var(--color-bg-50)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/sections/view/${s.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text-900)]">{s.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">Grade {s.gradeLevel}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{s.schoolYear}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{s.curriculum}</td>
                    <td className="px-4 py-3">
                      {s.adviser
                        ? <span className="text-[var(--color-text-700)]">{s.adviser.name}</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">Unassigned</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{s.classSize}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* [SECTION] Pagination */}
        {displayedSections.length !== 0 && (
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

export default AdminSections;