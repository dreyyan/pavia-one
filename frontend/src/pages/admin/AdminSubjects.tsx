/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import SubjectFormModal from "../../components/forms/SubjectFormModal";

// Constants & Types
import { gradeLevelOptions } from "../../constants";
import { LearningAreaFormData } from "../../types";

// ? [INTERFACES]
interface Subject {
  id: number;
  code: string;
  name: string;
  gradeLevel: number;
  hoursPerWeek?: number;
  description?: string;
  curriculum?: string;
  writtenWorkWeight?: number;
  performanceTaskWeight?: number;
  quarterlyAssessmentWeight?: number;
  createdAt: string;
}

interface GeneralModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: "default" | "error" | "success" | "info" | "warning";
  confirmText: string;
  isCancelable: boolean;
  onConfirm: () => void;
}

const AdminSubjects = () => {
  const navigate = useNavigate();

  // [STATES] Entities
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [selectedGrade, setSelectedGrade] = useState<string | "All">("All");
  const [showGradeFilters, setShowGradeFilters] = useState(false);

  // [STATES] Subject Form Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<LearningAreaFormData>({
    name: "",
    gradeLevel: "",
    curriculum: "Regular",
    writtenWorkWeight: "0.3",
    performanceTaskWeight: "0.5",
    quarterlyAssessmentWeight: "0.2",
  });

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

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
    setGeneralModal({
      ...generalModal,
      isOpen: true,
      ...config,
    });
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
  };

  // * [HANDLE] Fetch Subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to fetch subjects");

      setSubjects(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      // ! [ERROR] Fetching subjects failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Subjects",
        message: "We couldn't load your subjects at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // [EFFECT] Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowSortFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // * [HANDLE] Add Subject
  const handleAddSubject = () => {
    setFormData({
      name: "",
      gradeLevel: "",
      curriculum: "Regular",
      writtenWorkWeight: "0.3",
      performanceTaskWeight: "0.5",
      quarterlyAssessmentWeight: "0.2",
    });
    setFormError("");
    setShowSubjectModal(true);
  };

  // * [HANDLE] Submit
  const handleSubmit = async () => {
    setLoading(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          gradeLevel: Number(formData.gradeLevel),
          curriculum: formData.curriculum,
          writtenWorkWeight: Number(formData.writtenWorkWeight),
          performanceTaskWeight: Number(formData.performanceTaskWeight),
          quarterlyAssessmentWeight: Number(formData.quarterlyAssessmentWeight),
        }),
      });

      const data = await res.json();

      // ! [ERROR] Failed API response
      if (!data.success) {
        console.error(data.message || "Failed to add subject");
      }

      // * [SUCCESS] Subject created
      openGeneralModal({
        title: "Subject Created",
        message: "The subject has been added successfully.",
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });

      setShowSubjectModal(false);
      await fetchSubjects();
    } catch (err: any) {
      // ! [ERROR] Subject creation failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Create Subject",
        message: "We couldn't create your subject at the moment. Please check your internet connection and try again.",
        type: "error",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setFormError(err.message || "An unexpected error occurred while creating the subject.");
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Delete Subject
  const handleDelete = (id: number) => {
    const onDeleteConfirm = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete subject");

        setSubjects(prev => prev.filter(s => s.id !== id));

        // * [SUCCESS] Subject deleted
        openGeneralModal({
          title: "Subject Deleted",
          message: "The subject has been deleted successfully.",
          type: "success",
          isCancelable: false,
          onConfirm: () => {
            closeGeneralModal();
          },
        });
      } catch (err) {
        // ! [ERROR] Subject deletion failed
        console.error("Delete error:", err);
        openGeneralModal({
          title: "Unable to Delete Subject",
          message: "We couldn't delete the subject at the moment. Please check your internet connection and try again.",
          type: "error",
          isCancelable: true,
          onConfirm: () => closeGeneralModal(),
        });
      } finally {
        setLoading(false);
      }
    };

    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Subject",
      message: "Are you sure you want to delete this subject? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: onDeleteConfirm,
    });
  };

  // [HANDLE] Search, Sort, and Grade Filter
  const filteredSubjects = subjects
    .filter(s =>
      (
        (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
        (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
      ) &&
      (selectedGrade === "All" || String(s.gradeLevel) === selectedGrade)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "grade-asc": return a.gradeLevel - b.gradeLevel;
        case "grade-desc": return b.gradeLevel - a.gradeLevel;
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const displayedSubjects = filteredSubjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Subjects", path: null },
  ];

  // ? [LOADING STATE] Show skeleton while loading
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
      {/* [MODAL] Subject Form */}
      <SubjectFormModal
        isOpen={showSubjectModal}
        title="Create Subject"
        onClose={() => setShowSubjectModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
      />

      <div className="py-10 px-4 space-y-4 relative">

        {/* [SECTION] Header & Breadcrumbs */}
        <div>
          <h2 className="text-[var(--color-text-800)] leading-0">Subjects</h2>
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
          {/* [INPUT] Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
            />
          </div>

          {/* [DROPDOWN] Sort Filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowSortFilters(!showSortFilters)}
              className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
            >
              <img src="/sort-icon.svg" alt="Sort" className="size-4" />
            </button>
            {showSortFilters && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
                <button onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}>Name ↑</button>
                <button onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}>Name ↓</button>
                <button onClick={() => { setSortOption("grade-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "grade-asc" ? "bg-blue-100" : ""}`}>Grade ↑</button>
                <button onClick={() => { setSortOption("grade-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "grade-desc" ? "bg-blue-100" : ""}`}>Grade ↓</button>
              </div>
            )}
          </div>

          {/* [DROPDOWN] Grade Filter */}
          <div className="relative">
            <button
              onClick={() => setShowGradeFilters(!showGradeFilters)}
              className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
            >
              <img src="/filter-icon.svg" alt="Grade Filter" className="size-4" />
            </button>
            {showGradeFilters && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50 max-h-48 overflow-y-auto">
                <button onClick={() => { setSelectedGrade("All"); setPage(1); setShowGradeFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === "All" ? "bg-blue-100" : ""}`}>All</button>
                {gradeLevelOptions.map(g => (
                  <button key={g} onClick={() => { setSelectedGrade(g); setPage(1); setShowGradeFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedGrade === g ? "bg-blue-100" : ""}`}>Grade {g}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* [SECTION] Add Subject */}
        <div className="mt-2 space-y-2">
          <PrimaryButton text="Add Subject" iconSrc="/add-icon.svg" onClick={handleAddSubject} />
        </div>

        {/* [SECTION] Subjects: Mobile View (Cards) */}
        <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {!loading && (
            filteredSubjects.length === 0 ? (
              <EmptyState
                title="No subjects found"
                subtitle={
                  subjects.length === 0
                    ? "You currently have no assigned subjects. Please contact admin if this is an error."
                    : "No subjects match your current filters or search. Try adjusting your criteria."
                }
                iconSrc="/no-data-icon.svg"
              />
            ) : (
              displayedSubjects.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/admin/subjects/view/${s.id}`)}
                >
                  <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
                    <div className="flex items-center w-full gap-3 min-w-0">
                      <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border border-[var(--color-primary-200)] flex-shrink-0 px-1">
                        G{s.gradeLevel}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-roboto font-bold text-[var(--color-text-900)] text-base leading-tight truncate">{s.name}</p>
                        <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">{s.code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--color-text-700)] font-figree font-semibold">Grade Level</span>
                      <span className="text-[var(--color-text-900)]">{s.gradeLevel ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--color-text-700)] font-figree font-semibold">Curriculum</span>
                      <span className="text-[var(--color-text-900)]">{s.curriculum ?? "—"}</span>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* [SECTION] Subjects: Desktop View (Table) */}
        <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden">
          <table className="w-full text-sm font-roboto">
            <thead>
              <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Subject</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Grade</th>
                <th className="px-4 py-3 text-left">Hrs/Week</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-600)]">No subjects found.</td>
                </tr>
              ) : (
                displayedSubjects.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--color-bg-200)] hover:bg-[var(--color-bg-50)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/subjects/view/${s.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text-900)]">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-[var(--color-text-600)] text-xs">{s.code}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">Grade {s.gradeLevel}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{s.hoursPerWeek ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDelete(s.id)} className="text-xs font-roboto text-[var(--color-red-500)] hover:underline cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* [SECTION] Pagination */}
        {displayedSubjects.length !== 0 && (
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

export default AdminSubjects;