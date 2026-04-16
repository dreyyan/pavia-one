/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import StudentFormModal from "../../components/forms/StudentFormModal";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";

// [IMPORT] Constants & Types
import { GeneralModalConfig, StudentFormData, Adviser, Student } from "../../types";
import { SEX_OPTIONS } from "../../constants";

const AdminStudents = () => {
  const navigate = useNavigate();

  // [STATES] Entities
  const [students, setStudents] = useState<Student[]>([]);
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATES] Search, Sort, and Filter
  const [search, setSearch] = useState("");
  const [adviserSearch, setAdviserSearch] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "lrn-asc" | "lrn-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [selectedSex, setSelectedSex] = useState<string | "All">("All");
  const [showSexFilters, setShowSexFilters] = useState(false);

  // [STATES] Student Form Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<StudentFormData>({
    lrn: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nameExtension: "",
    email: "",
    sex: "MALE",
    birthDate: "",
    createdByAdviserId: "",
    adviserName: "",
    advisorySection: null,
    learningModality: "Face to Face",
  });

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

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [STATE] Selected students for bulk actions
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // * [HANDLE] Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch students");

      // ensure students is always an array (response is data.data.data due to pagination wrapper)
      const list = data.data?.data;
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      // ! [ERROR] Fetching student failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Student",
        message: "We couldn't load the student at the moment. Please check your internet connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // * [HANDLE] Fetch advisers for dropdown (with optional search) 
  const fetchAdvisers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to fetch advisers");
      setAdvisers(Array.isArray(data.data?.data) ? data.data.data : []);
    } catch (err) {
      // ! [ERROR] Fetching advisers failed
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

  // * [HANDLE] Add student
  const handleAddStudent = async () => {
    setFormData({
      lrn: "",
      firstName: "",
      middleName: "",
      lastName: "",
      nameExtension: "",
      email: "",
      sex: "MALE",
      birthDate: "",
      createdByAdviserId: "",
      adviserName: "",
      advisorySection: null,
      learningModality: "Face to Face",
    });
    setAdviserSearch("");
    setIsEditMode(false);
    setFormError("");
    await fetchAdvisers();
    setShowStudentModal(true);
  };

  // * [HANDLE] Bulk delete selected students
  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) return;

    // ? [CONFIRMATION] Show confirmation modal before bulk deletion
    openGeneralModal({
      title: "Delete Students",
      message: `Are you sure you want to delete ${selectedStudents.length} selected student(s)? This action cannot be undone.`,
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ ids: selectedStudents }),
          });

          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Bulk delete failed");

          // Success
          setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
          setSelectedStudents([]);

          // * [SUCCESS] Show success modal after deletion
          openGeneralModal({
            title: "Students Deleted",
            message: `${selectedStudents.length} student(s) have been deleted successfully.`,
            type: "success",
            confirmText: "OK",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } catch (err) {
          // ! [ERROR] Bulk delete failed
          console.error("Bulk delete error:", err);
          openGeneralModal({
            title: "Unable to Delete Students",
            message: "We couldn't delete the selected students at the moment. Please check your internet connection and try again.",
            type: "error",
            confirmText: "Close",
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // * [HANDLE] Submit create/edit form
  const handleSubmit = async () => {
    const adviserId = formData.createdByAdviserId?.trim();

    if (!adviserId) {
      setFormError("Please select an adviser.");
      setLoading(false);
      return;
    }

    const dataToSubmit = isEditMode
      ? {
          id: formData.id,
          lrn: formData.lrn.trim(),
          firstName: formData.firstName.trim(),
          middleName: formData.middleName || null,
          lastName: formData.lastName.trim(),
          nameExtension: formData.nameExtension || null,
          email: formData.email || null,
          sex: formData.sex,
          birthDate: formData.birthDate || null,
          learningModality: formData.learningModality,
        }
      : {
          lrn: formData.lrn.trim(),
          firstName: formData.firstName.trim(),
          middleName: formData.middleName || null,
          lastName: formData.lastName.trim(),
          nameExtension: formData.nameExtension || null,
          email: formData.email || null,
          sex: formData.sex,
          birthDate: formData.birthDate || null,
          createdByAdviserId: adviserId,
          learningModality: formData.learningModality,
          ...(formData.advisorySection ? { sectionId: formData.advisorySection.id } : {}),
        };

    setLoading(true);
    setFormError("");   // ← Clear previous error

    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        method,
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(isEditMode ? [dataToSubmit] : dataToSubmit),
      });

      const data = await res.json();

      // Handle backend validation / business errors
      if (!data.success) {
        const errorMsg = data.message 
          || data.data?.failed?.[0]?.message 
          || "Operation failed";
        
        throw new Error(errorMsg);
      }

      // Success path
      if (isEditMode) {
        const updated = data.data?.updated;
        if (updated && updated.length > 0) {
          await fetchStudents();
        }
      } else {
        const created = data.data?.created;
        if (created && created.length > 0) {
          setStudents(prev => [...prev, created[0]]);
        }
      }

      // Close modal on success
      setShowStudentModal(false);
      
      // Optional: Show success notification
      openGeneralModal({
        title: isEditMode ? "Student Updated" : "Student Created",
        message: isEditMode 
          ? "The student has been updated successfully." 
          : "The student has been added successfully.",
        type: "success",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });

    } catch (err: any) {
      console.error("Submit error:", err);
      
      // Show the real error message from backend (e.g. "Student already exists")
      const errorMessage = err.message || "An unexpected error occurred while saving the student.";
      setFormError(errorMessage);

      // Optional: Also show it in a general modal for better visibility
      openGeneralModal({
        title: "Save Failed",
        message: errorMessage,
        type: "error",
        confirmText: "OK",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } finally {
      setLoading(false);
    }
  };

  // * [HANDLE] Sorting and Searching
  const filteredStudents = students
    .filter(s =>
      (
        (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase())) ||
        (s.lrn && s.lrn.includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
      ) &&
      (selectedSex === "All" || s.sex === selectedSex)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return (a.fullName || "").localeCompare(b.fullName || "");
        case "name-desc": return (b.fullName || "").localeCompare(a.fullName || "");
        case "lrn-asc": return a.lrn.localeCompare(b.lrn);
        case "lrn-desc": return b.lrn.localeCompare(a.lrn);
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const displayedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // [HANDLE] Get visible pagination pages
  const getVisiblePages = (current: number, total: number) => {
    const delta = 1; // how many pages around current

    const range: (number | "...")[] = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);

    if (left > 2) range.push("...");

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < total - 1) range.push("...");

    if (total > 1) range.push(total);

    return range;
  };

  // * [BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Students", path: null },
  ];

  // ? [LOADING STATE]
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
      {/* [STUDENT FORM MODAL] */}
      <StudentFormModal
        isOpen={showStudentModal}
        title={isEditMode ? "Edit Student" : "Create Student"}
        onClose={() => setShowStudentModal(false)}
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
      <div className="py-10 px-4 space-y-4 relative">

      {/* [SECTION] Header & Breadcrumbs */}
      <div>
        {/* [UI] Header */}
        <h2 className="text-[var(--color-text-800)] leading-0">Students</h2>

        {/* [UI] Breadcrumbs */}
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
            placeholder="Search by name, LRN, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] h-full"
          />
        </div>
        
        {/* [DROPDOWN] Sort Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowSortFilters(!showSortFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer ${
              showSortFilters ? "bg-[var(--color-bg-50)]" : "bg-[var(--color-bg-50)] hover:opacity-80"
            }`}
          >
            <img src="/sort-icon.svg" alt="Sort" className="size-4" />
          </button>

          {showSortFilters && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button onClick={() => { setSortOption("name-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-asc" ? "bg-blue-100" : ""}`}>Name ↑</button>
              <button onClick={() => { setSortOption("name-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "name-desc" ? "bg-blue-100" : ""}`}>Name ↓</button>
              <button onClick={() => { setSortOption("lrn-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "lrn-asc" ? "bg-blue-100" : ""}`}>LRN ↑</button>
              <button onClick={() => { setSortOption("lrn-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "lrn-desc" ? "bg-blue-100" : ""}`}>LRN ↓</button>
            </div>
          )}
        </div>

        {/* [DROPDOWN] Sex Filter */}
        <div className="relative">
          <button
            onClick={() => setShowSexFilters(!showSexFilters)}
            className={`flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer ${
              showSexFilters ? "bg-[var(--color-bg-50)]" : "bg-[var(--color-bg-50)] hover:opacity-80"
            }`}
          >
            <img src="/filter-icon.svg" alt="Sex Filter" className="size-4" />
          </button>

          {showSexFilters && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
              <button
                onClick={() => { setSelectedSex("All"); setPage(1); setShowSexFilters(false); }}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedSex === "All" ? "bg-blue-100" : ""}`}
              >
                All
              </button>
                {SEX_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { 
                      setSelectedSex(option.value); 
                      setPage(1); 
                      setShowSexFilters(false); 
                    }}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedSex === option.value ? "bg-blue-100" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* [SECTION] Add Student */}
      <div className="mt-2 space-y-2">
        <PrimaryButton text="Add Student" iconSrc="/add-icon.svg" onClick={handleAddStudent} />
      </div>

      {/* [SECTION] Bulk Actions (Visible when student rows are selected) */}
      {selectedStudents.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[var(--color-bg-50)] rounded-md border border-[var(--color-bg-200)]">
          <span className="text-sm font-roboto text-[var(--color-text-700)]">
            {selectedStudents.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="text-sm font-medium font-roboto text-[var(--color-red-500)] hover:underline cursor-pointer"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedStudents([])}
            className="text-sm font-medium font-roboto text-[var(--color-text-600)] hover:underline cursor-pointer ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* [CARDS] Students - Mobile View */}
      <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
        {!loading && (
          <>
            {/* Empty state for current filters first */}
            {displayedStudents.length === 0 ? (
              <EmptyState
                title="No students found"
                subtitle="No students match your current filters or search. Try adjusting your criteria."
                iconSrc="/no-data-icon.svg"
              />
            ) : students.length === 0 ? (
              // Fallback: no students at all
              <EmptyState
                title="No students found"
                subtitle="You currently have no assigned students. Please contact admin if this is an error."
                iconSrc="/no-data-icon.svg"
              />
            ) : null}
          </>
        )}
        {displayedStudents.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => navigate(`/admin/students/view/${s.id}`)}
          >
            {/* Header */}
            <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
              <div className="flex items-center w-full gap-3 min-w-0">
                {/* Initials Avatar */}
                <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold px-4 text-xl border border-[var(--color-primary-200)] flex-shrink-0">
                  {s.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>

                {/* Name + LRN */}
                <div className="flex-1 min-w-0">
                  <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
                    {s.fullName}
                  </p>
                  <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
                    LRN <span className="font-semibold text-[var(--color-text-700)]">{s.lrn}</span>
                  </p>
                </div>

                {/* Sex Badge */}
                <div className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                  s.sex === 'MALE'
                    ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)]'
                    : s.sex === 'FEMALE'
                      ? 'bg-[var(--color-red-100)] text-[var(--color-red-500)]'
                      : 'bg-[var(--color-bg-100)] text-gray-600'
                }`}>
                  {s.sex === 'MALE' ? 'M' : s.sex === 'FEMALE' ? 'F' : '—'}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-700)] font-figree font-semibold">Email</span>
                <span className="text-[var(--color-text-900)] truncate text-right max-w-[210px]">
                  {s.email ?? "—"}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-700)] font-figree font-semibold">Adviser</span>
                <span className="text-[var(--color-text-900)] truncate text-right max-w-[210px]">
                  {s.adviser?.name ?? "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* [SECTION] Pagination */}
      {displayedStudents.length !== 0 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
              page === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            &lt;
          </button>

          {/* Page Dots with Numbers */}
          <div className="flex items-center gap-2">
            {getVisiblePages(page, totalPages).map((num, idx) =>
              num === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="px-1 text-[var(--color-text-600)]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={num}
                  onClick={() => setPage(num as number)}
                  className={`size-6 flex items-center justify-center rounded-full font-bold text-xs transition-all duration-150 ${
                    num === page
                      ? "size-7 bg-[var(--color-primary-500)] text-[var(--color-text-50)] scale-110"
                      : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)]"
                  }`}
                >
                  {num}
                </button>
              )
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`size-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
              page === totalPages ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
            }`}
          >
            &gt;
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminStudents;