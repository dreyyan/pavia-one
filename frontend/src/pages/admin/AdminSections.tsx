// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";

// ?[INTERFACES]
interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  learningModality: string;
  classSize: number;
  room?: string;
  createdAt: string;
  adviser?: { id: number; name: string; adviserId: string };
}

// ?[FORM DATA]
type FormData = {
  id?: number;
  name: string;
  gradeLevel: string;
  schoolYear: string;
  curriculum: string;
  learningModality: string;
  room: string;
};

const gradeLevelOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const curriculumOptions = ["K-12", "SHS STEM", "SHS ABM", "SHS HUMSS", "SHS GAS", "SHS TVL", "SHS Sports", "SHS Arts"];
const learningModalityOptions = ["Face to Face", "Distance Learning", "Blended", "Online", "Homeschool", "Other"];

const TOTAL_STEPS = 2;

// *[COMPONENT] Multi-step Section Form Modal
const SectionFormModal = ({
  isOpen,
  title,
  onClose,
  onSubmit,
  formData,
  setFormData,
  loading,
  formError,
  setFormError,
  isEditMode,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  loading: boolean;
  formError: string;
  setFormError: React.Dispatch<React.SetStateAction<string>>;
  isEditMode: boolean;
}) => {
  const [step, setStep] = useState(1);

  // [RESET] Step back to 1 when modal opens
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  // [VALIDATE] Per-step before advancing
  const validateStep = (): boolean => {
    setFormError("");
    if (step === 1) {
      if (!(formData.name || "").trim()) { setFormError("Section name is required"); return false; }
      if (!formData.gradeLevel) { setFormError("Grade level is required"); return false; }
      if (!(formData.schoolYear || "").trim()) { setFormError("School year is required"); return false; }
    }
    if (step === 2) {
      if (!formData.curriculum) { setFormError("Curriculum is required"); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setFormError("");
    setStep(s => Math.max(s - 1, 1));
  };

  const handleConfirm = async () => {
    if (!validateStep()) return;
    await onSubmit();
  };

  // [SHARED] Input class
  const inputCls = "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-100)] rounded-lg p-6 w-full max-w-md shadow-lg">

        {/* [HEADER] Title + step counter */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[var(--color-text-900)]">{title}</h2>
          <span className="text-xs font-roboto text-[var(--color-text-600)]">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* [UI] Progress bar segments */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                i + 1 <= step ? "bg-[var(--color-primary-600)]" : "bg-[var(--color-bg-300)]"
              }`}
            />
          ))}
        </div>

        {/* ─── STEP 1 — Identity ─── */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Section Identity</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Section Name <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" value={formData.name} placeholder="e.g. Rizal, Mabini"
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Grade Level <span className="text-[var(--color-red-500)]">*</span></label>
              <select value={formData.gradeLevel} onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))} className={inputCls}>
                <option value="" disabled>Select grade level</option>
                {gradeLevelOptions.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">School Year <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" value={formData.schoolYear} placeholder="e.g. 2024–2025"
                onChange={(e) => setFormData(prev => ({ ...prev, schoolYear: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}

        {/* ─── STEP 2 — Configuration ─── */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Configuration</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Curriculum <span className="text-[var(--color-red-500)]">*</span></label>
              <select value={formData.curriculum} onChange={(e) => setFormData(prev => ({ ...prev, curriculum: e.target.value }))} className={inputCls}>
                <option value="" disabled>Select curriculum</option>
                {curriculumOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Learning Modality</label>
              <select value={formData.learningModality} onChange={(e) => setFormData(prev => ({ ...prev, learningModality: e.target.value }))} className={inputCls}>
                {learningModalityOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Room <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <input type="text" value={formData.room} placeholder="e.g. Room 101"
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}

        {/* [ERROR] Form error message */}
        {formError && <p className="text-[var(--color-red-500)] text-sm mt-3">{formError}</p>}

        {/* [FOOTER] Back / Next / Submit */}
        <div className="flex justify-between items-center gap-3 mt-6">
          <button
            onClick={step === 1 ? onClose : handleBack}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-bg-100)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-200)] transition-colors text-sm disabled:opacity-60"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          {step < TOTAL_STEPS ? (
            <button onClick={handleNext} disabled={loading}
              className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60">
              Next →
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={loading}
              className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60">
              {loading ? "Processing..." : isEditMode ? "Update" : "Create"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

// *────────────────────────────────────────────────
// * MAIN PAGE
// *────────────────────────────────────────────────
const AdminSections = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "grade-asc" | "grade-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // [STATES] Grade filter
  const [selectedGrade, setSelectedGrade] = useState<string | "All">("All");
  const [showGradeFilters, setShowGradeFilters] = useState(false);

  // [STATES] Section form modal
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] CrudModal — confirmations only (delete, errors)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  const [formData, setFormData] = useState<FormData>({
    name: "",
    gradeLevel: "",
    schoolYear: "",
    curriculum: "",
    learningModality: "Face to Face",
    room: "",
  });

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [FETCH] Sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch sections");

      const list = data.data?.data;
      setSections(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching sections");
      setIsCancelable(true);
      setShowModal(true);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
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

  // [HANDLE] Add section
  const handleAddSection = () => {
    setFormData({ name: "", gradeLevel: "", schoolYear: "", curriculum: "", learningModality: "Face to Face", room: "" });
    setIsEditMode(false);
    setFormError("");
    setShowSectionModal(true);
  };

  // [HANDLE] Open edit
  const handleOpenEdit = (section: Section) => {
    setFormData({
      id: section.id,
      name: section.name,
      gradeLevel: String(section.gradeLevel),
      schoolYear: section.schoolYear,
      curriculum: section.curriculum,
      learningModality: section.learningModality,
      room: section.room || "",
    });
    setIsEditMode(true);
    setFormError("");
    setShowSectionModal(true);
  };

  // [HANDLE] Submit form (create or update)
  const handleSubmit = async () => {
    const dataToSubmit = {
      ...(isEditMode && { id: formData.id }),
      name: formData.name.trim(),
      gradeLevel: Number(formData.gradeLevel),
      schoolYear: formData.schoolYear.trim(),
      curriculum: formData.curriculum,
      learningModality: formData.learningModality,
      room: formData.room || null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(isEditMode ? [dataToSubmit] : dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        const updated = data.data?.updated;
        if (updated && updated.length > 0) {
          await fetchSections();
        } else {
          setFormError(data.data?.failed?.[0]?.message || "Section update failed");
          return;
        }
      } else {
        await fetchSections();
      }

      setShowSectionModal(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete section
  const handleDelete = (id: number) => {
    setModalTitle("Delete Section");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sections/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete section");
        setSections(prev => prev.filter(s => s.id !== id));
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
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "grade-asc": return a.gradeLevel - b.gradeLevel;
        case "grade-desc": return b.gradeLevel - a.gradeLevel;
        default: return 0;
      }
    });

  // [PAGINATION]
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const displayedSections = filteredSections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Sections", path: null },
  ];

  return (
    <div>
      {/* [SECTION FORM MODAL] */}
      <SectionFormModal
        isOpen={showSectionModal}
        title={isEditMode ? "Edit Section" : "Create Section"}
        onClose={() => setShowSectionModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        formError={formError}
        setFormError={setFormError}
        isEditMode={isEditMode}
      />

      {/* [CRUD MODAL] Confirmations (Delete/Error) */}
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
          {/* [INPUT] Search */}
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

        {/* [SECTION] Add Section */}
        <div className="mt-2 space-y-2">
          <PrimaryButton text="Add Section" iconSrc="/add-icon.svg" onClick={handleAddSection} />
        </div>

        {/* [CARDS] Sections — Mobile View */}
        <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {displayedSections.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/admin/sections/view/${s.id}`)}
            >
              <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
                <div className="flex items-center w-full gap-3 min-w-0">
                  <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xl border border-[var(--color-primary-200)] flex-shrink-0">
                    {s.gradeLevel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">{s.name}</p>
                    <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">{s.schoolYear}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Curriculum</span>
                  <span className="text-[var(--color-text-900)]">{s.curriculum}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Adviser</span>
                  <span className="text-[var(--color-text-900)] truncate text-right max-w-[180px]">{s.adviser?.name ?? "—"}</span>
                </div>
              </div>
            </div>
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedSections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-600)]">No sections found.</td>
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
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{s.adviser?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{s.classSize}</td>
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