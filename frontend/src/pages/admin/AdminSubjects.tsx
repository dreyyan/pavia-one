/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";
import SubjectFormModal from "../../components/forms/SubjectFormModal";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

// ? [CONSTANTS]
const gradeLevelOptions = ["7", "8", "9", "10"];

// ?[INTERFACES]
interface Subject {
  id: number;
  code: string;
  name: string;
  gradeLevel: number;
  hoursPerWeek?: number;
  description?: string;
  createdAt: string;
}

// ? [TYPE]
type FormData = {
  id?: number;
  code: string;
  name: string;
  gradeLevel: string;
  hoursPerWeek: string;
  description: string;
};

const AdminSubjects = () => {
  const navigate = useNavigate();

  // [STATES]
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // [STATES] Grade filter
  const [selectedGrade, setSelectedGrade] = useState<string | "All">("All");
  const [showGradeFilters, setShowGradeFilters] = useState(false);

  // [STATES] Subject form modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] Modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"default" | "error" | "success" | "info" | "warning">("default");
  const [modalConfirmText, setModalConfirmText] = useState("OK");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    gradeLevel: "",
    hoursPerWeek: "",
    description: "",
  });

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // * [HANDLE] Fetch subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/learning-area`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch subjects");

      const list = data.data?.data;
      setSubjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setModalTitle("Error Fetching Subjects");
      setModalMessage("An error occurred while fetching subjects. Please try again later.");
      setModalType("error");
      setIsCancelable(true);
      setShowModal(true);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // [HANDLE] Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowSortFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // [HANDLE] Add subject
  const handleAddSubject = () => {
    setFormData({ code: "", name: "", gradeLevel: "", hoursPerWeek: "", description: "" });
    setIsEditMode(false);
    setFormError("");
    setShowSubjectModal(true);
  };

  // [HANDLE] Open edit
  const handleOpenEdit = (subject: Subject) => {
    setFormData({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      gradeLevel: String(subject.gradeLevel),
      hoursPerWeek: subject.hoursPerWeek ? String(subject.hoursPerWeek) : "",
      description: subject.description || "",
    });
    setIsEditMode(true);
    setFormError("");
    setShowSubjectModal(true);
  };

  // [HANDLE] Submit form (create or update)
  const handleSubmit = async () => {
    const dataToSubmit = {
      ...(isEditMode && { id: formData.id }),
      code: formData.code.trim(),
      name: formData.name.trim(),
      gradeLevel: Number(formData.gradeLevel),
      hoursPerWeek: formData.hoursPerWeek ? Number(formData.hoursPerWeek) : null,
      description: formData.description || null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/subjects`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(isEditMode ? [dataToSubmit] : dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        const updated = data.data?.updated;
        if (updated && updated.length > 0) {
          await fetchSubjects();
        } else {
          setFormError(data.data?.failed?.[0]?.message || "Subject update failed");
          return;
        }
      } else {
        await fetchSubjects();
      }

      setShowSubjectModal(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete subject
  const handleDelete = (id: number) => {
    setModalTitle("Delete Subject");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/subjects/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete subject");
        setSubjects(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error("Delete error:", err);
        setModalTitle("Delete Failed");
        setIsCancelable(true);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onDeleteConfirm);
  };

  // [LOADING STATE]
  if (loading) return <Skeleton />;

  // [HANDLE] Sorting and Searching
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

  // [PAGINATION]
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const displayedSubjects = filteredSubjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Subjects", path: null },
  ];

  return (
    <div>
      {/* [MODAL] General */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        confirmText={modalConfirmText}
        onConfirm={onConfirmAction}
        isCancelable={isCancelable}
      />
      {/* [MODAL] Subject Form */}
      <SubjectFormModal
        isOpen={showSubjectModal}
        title={isEditMode ? "Edit Subject" : "Create Subject"}
        onClose={() => setShowSubjectModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
        isEditMode={isEditMode}
      />
      {/* [MODAL] CRUD Confirmations (Delete/Error) */}
      <CrudModal
        isOpen={showModal}
        title={modalTitle}
        isCancelable={isCancelable}
        onClose={() => setShowModal(false)}
        onConfirm={onConfirmAction}
        loading={loading}
        showForm={false}
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
          {/* [EMPTY STATE] No Subjects Display */}
          {!loading && subjects.length === 0 && (
            <EmptyState
              title="No subjects found"
              subtitle="You currently have no assigned subjects. Please contact admin if this is an error."
              iconSrc="/no-data-icon.svg"
            />
          )}

          {displayedSubjects.map((s) => (
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
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Hours/Week</span>
                  <span className="text-[var(--color-text-900)]">{s.hoursPerWeek ?? "—"}</span>
                </div>
              </div>
            </div>
          ))}
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
                        <button onClick={() => handleOpenEdit(s)} className="text-xs font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer">Edit</button>
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