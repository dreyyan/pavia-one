// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";

// ?[INTERFACES]
interface Student {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  sex?: string;
  birthDate?: string;
  email?: string;
  createdByAdviserId: string;
  createdAt: string;
  adviser?: { id: number; name: string; adviserId: string };
  enrollments: {
    id: number;
    sectionId: number;
    schoolYear: string;
    status: string;
    learningModality: string;
  }[];
}

interface AdviserSection {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  classSize: number;
  isAdvisory?: boolean;
}

interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  sections: AdviserSection[];
}

// ?[FORM STEPS]
type FormData = {
  id?: number;
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  email: string;
  sex: string;
  birthDate: string;
  createdByAdviserId: string;
  adviserName: string;
  advisorySection: AdviserSection | null;
  learningModality: string;
};

const sexOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];
const learningModalityOptions = [
  "Face to Face",
  "Distance Learning",
  "Blended",
  "Online",
  "Homeschool",
  "Other",
];

const TOTAL_CREATE_STEPS = 3;
const TOTAL_EDIT_STEPS = 2;

// *[COMPONENT] Multi-step Student Form Modal
const StudentFormModal = ({
  isOpen,
  title,
  onClose,
  onSubmit,
  formData,
  setFormData,
  advisers,
  adviserSearch,
  setAdviserSearch,
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
  advisers: Adviser[];
  adviserSearch: string;
  setAdviserSearch: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  formError: string;
  setFormError: React.Dispatch<React.SetStateAction<string>>;
  isEditMode: boolean;
}) => {
  const [step, setStep] = useState(1);
  const [showAdviserDropdown, setShowAdviserDropdown] = useState(false);
  const adviserDropdownRef = useRef<HTMLDivElement>(null);

  const totalSteps = isEditMode ? TOTAL_EDIT_STEPS : TOTAL_CREATE_STEPS;

  // [RESET] Step back to 1 when modal opens
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  // [HANDLE] Close adviser dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adviserDropdownRef.current && !adviserDropdownRef.current.contains(e.target as Node)) {
        setShowAdviserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // [VALIDATE] Per-step before advancing
  const validateStep = (): boolean => {
    setFormError("");
    if (step === 1) {
      if (!(formData.lrn || "").trim()) { setFormError("LRN is required"); return false; }
      if ((formData.lrn || "").trim().length !== 12) { setFormError("LRN must be exactly 12 digits"); return false; }
      if (!(formData.firstName || "").trim()) { setFormError("First name is required"); return false; }
      if (!(formData.lastName || "").trim()) { setFormError("Last name is required"); return false; }
    }
    if (step === 2) {
      if (!formData.sex) { setFormError("Sex is required"); return false; }
    }
    if (step === 3 && !isEditMode) {
      if (!formData.createdByAdviserId) { setFormError("Please select an adviser"); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setFormError("");
    setStep(s => Math.max(s - 1, 1));
  };

  const handleConfirm = async () => {
    if (!validateStep()) return;
    await onSubmit();
  };

  // [COMPUTED] Filtered adviser list for search
  const filteredAdvisers = advisers.filter(a =>
    a.name.toLowerCase().includes(adviserSearch.toLowerCase()) ||
    a.adviserId.includes(adviserSearch)
  );

  // [SHARED] Input class
  const inputCls = "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-100)] rounded-lg p-6 w-full max-w-md shadow-lg">

        {/* [HEADER] Title + step counter */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[var(--color-text-900)]">{title}</h2>
          <span className="text-xs font-roboto text-[var(--color-text-600)]">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* [UI] Progress bar segments */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
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
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Identity</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">LRN <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" maxLength={12} value={formData.lrn} placeholder="12-digit Learner Reference Number"
                onChange={(e) => setFormData(prev => ({ ...prev, lrn: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">First Name <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Middle Name <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <input type="text" value={formData.middleName}
                onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Last Name <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Name Extension <span className="text-[var(--color-text-500)] text-xs">(e.g. Jr., Sr., III)</span></label>
              <input type="text" value={formData.nameExtension}
                onChange={(e) => setFormData(prev => ({ ...prev, nameExtension: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}

        {/* ─── STEP 2 — Personal ─── */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Personal Details</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Sex <span className="text-[var(--color-red-500)]">*</span></label>
              <select value={formData.sex} onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))} className={inputCls}>
              {sexOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>
            {/* [DATE INPUT] Native date picker — not text */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Birth Date</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Email <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <input type="email" value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}

        {/* ─── STEP 3 — Enrollment (create only) ─── */}
        {step === 3 && !isEditMode && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Enrollment</p>

            {/* Adviser searchable dropdown */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Adviser <span className="text-[var(--color-red-500)]">*</span></label>
              <div ref={adviserDropdownRef} className="relative">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={adviserSearch}
                  onFocus={() => setShowAdviserDropdown(true)}
                  onChange={(e) => {
                    setAdviserSearch(e.target.value);
                    setFormData(prev => ({ ...prev, createdByAdviserId: "", adviserName: "", advisorySection: null }));
                    setShowAdviserDropdown(true);
                  }}
                  className={inputCls + " w-full"}
                />
                {showAdviserDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto">
                    {filteredAdvisers.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">No advisers found</p>
                    ) : (
                      filteredAdvisers.map(adviser => {
                        // [RESOLVE] Find the advisory section for this adviser
                        const advisory = adviser.sections?.find(s => s.isAdvisory);
                        return (
                          <button
                            key={adviser.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                createdByAdviserId: adviser.adviserId,
                                adviserName: adviser.name,
                                advisorySection: advisory ?? null,
                              }));
                              setAdviserSearch(adviser.name);
                              setShowAdviserDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-100)] transition-colors ${
                              formData.createdByAdviserId === adviser.adviserId
                                ? "bg-blue-50 text-[var(--color-primary-700)]"
                                : "text-[var(--color-text-900)]"
                            }`}
                          >
                            <span className="font-medium">{adviser.name}</span>
                            <span className="ml-2 text-xs text-gray-400">#{adviser.adviserId}</span>
                            {advisory && (
                              <span className="ml-2 text-xs text-[var(--color-primary-600)]">· {advisory.name}</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* [INFO] Advisory section auto-assignment notice */}
            {formData.advisorySection ? (
              <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-300)] rounded-md px-3 py-2 text-sm font-roboto text-[var(--color-text-700)]">
                <span className="font-semibold text-[var(--color-text-900)]">Advisory Section: </span>
                {formData.advisorySection.name} · Grade {formData.advisorySection.gradeLevel} · {formData.advisorySection.curriculum}
                <p className="text-xs text-[var(--color-text-500)] mt-0.5">Student will be auto-enrolled in this section.</p>
              </div>
            ) : formData.createdByAdviserId ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm font-roboto text-amber-700">
                This adviser has no advisory section. Student will be registered without a section enrollment.
              </div>
            ) : null}

            {/* Learning Modality */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Learning Modality</label>
              <select value={formData.learningModality}
                onChange={(e) => setFormData(prev => ({ ...prev, learningModality: e.target.value }))} className={inputCls}>
                {learningModalityOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
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

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60"
            >
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
const AdminStudents = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "lrn-asc" | "lrn-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  // [STATES] Show/hide dropdowns
  const [showSexFilters, setShowSexFilters] = useState(false);

  // [STATES] Student form modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] CrudModal — confirmations only (delete, errors)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  // [STATES] Advisers (fetched on modal open)
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [adviserSearch, setAdviserSearch] = useState("");

  const [formData, setFormData] = useState<FormData>({
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

  // [STATES] Filters
  const [selectedSex, setSelectedSex] = useState<string | "All">("All");

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [STATE] Selected students for bulk operations
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // [FETCH] Advisers with sections (to resolve isAdvisory)
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
      console.error("Fetch advisers error:", err);
      setAdvisers([]);
    }
  };

  // [HANDLE] Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;

    setModalTitle(`Delete ${selectedStudents.length} Selected Students`);
    setIsCancelable(true);
    setShowModal(true);

    const onBulkDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: selectedStudents }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Bulk delete failed");

        setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
        setSelectedStudents([]);
      } catch (err) {
        console.error("Bulk delete error:", err);
        setModalTitle("Bulk Delete Failed");
        setIsCancelable(true);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    setOnConfirmAction(() => onBulkDeleteConfirm);
  };

  // *[HANDLE] Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch students");

      // ensure students is always an array (response is data.data.data due to pagination wrapper)
      const list = data.data?.data;
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching students");
      setIsCancelable(true);
      setShowModal(true);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // [HANDLE] Add student
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

  // [HANDLE] Open edit
  const handleOpenEdit = async (student: Student) => {
    setFormData({
      id: student.id,
      lrn: student.lrn,
      firstName: student.firstName,
      middleName: student.middleName || "",
      lastName: student.lastName,
      nameExtension: student.nameExtension || "",
      email: student.email || "",
      sex: student.sex || "MALE",
      // [DATE] Strip time component so the date input renders correctly
      birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
      createdByAdviserId: student.createdByAdviserId,
      adviserName: student.adviser?.name || "",
      advisorySection: null,
      learningModality: student.enrollments?.[0]?.learningModality || "Face to Face",
    });
    setAdviserSearch(student.adviser?.name || "");
    setIsEditMode(true);
    setFormError("");
    await fetchAdvisers();
    setShowStudentModal(true);
  };

  // [HANDLE] Submit form (create or update)
  const handleSubmit = async () => {
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
          createdByAdviserId: formData.createdByAdviserId,
          learningModality: formData.learningModality,
          // [AUTO-ENROLL] Pass advisory section id if adviser has one
          ...(formData.advisorySection ? { sectionId: formData.advisorySection.id } : {}),
        };

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // PUT expects an array; POST accepts a single object
        body: JSON.stringify(isEditMode ? [dataToSubmit] : dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        const updated = data.data?.updated;
        if (updated && updated.length > 0) {
          // [REFETCH] Re-fetch full list to get updated student details
          await fetchStudents();
        } else {
          const failMsg = data.data?.failed?.[0]?.message;
          setFormError(failMsg || "Student update failed");
          return;
        }
      } else {
        const created = data.data?.created;
        if (created && created.length > 0) {
          setStudents(prev => [...prev, created[0]]);
        } else {
          const failMsg = data.data?.failed?.[0]?.message;
          setFormError(failMsg || "Student creation failed");
          return;
        }
      }

      setShowStudentModal(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete student
  const handleDelete = (id: number) => {
    setModalTitle("Delete Student");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/students/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete student");
        setStudents(prev => prev.filter(s => s.id !== id));
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

  // [PAGINATION]
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const displayedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Students", path: null },
  ];

  return (
    <div>
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
                {sexOptions.map((option) => (
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`size-6 flex items-center justify-center rounded-full font-bold text-xs transition-all duration-150 ${
                  num === page
                    ? "size-7 bg-[var(--color-primary-500)] text-[var(--color-text-50)] scale-110"
                    : "bg-[var(--color-bg-300)] text-[var(--color-text-900)] hover:bg-[var(--color-primary-400)]"
                }`}
                aria-label={`Go to page ${num}`}
              >
                {num}
              </button>
            ))}
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