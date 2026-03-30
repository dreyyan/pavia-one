// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
import CrudModal from "../../components/CrudModal";

// ?[INTERFACES]
interface Adviser {
  id: number;
  adviserId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  sex?: string;
  birthDate?: string;
  email?: string;
  contactNumber?: string;
  createdAt: string;
  sections: {
    id: number;
    name: string;
    gradeLevel: number;
    schoolYear: string;
    curriculum: string;
    isAdvisory?: boolean;
  }[];
}

// ?[FORM DATA]
type FormData = {
  id?: number;
  adviserId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  sex: string;
  birthDate: string;
  email: string;
  contactNumber: string;
};

const sexOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const TOTAL_STEPS = 2;

// *[COMPONENT] Multi-step Adviser Form Modal
const AdviserFormModal = ({
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
      if (!(formData.adviserId || "").trim()) { setFormError("Adviser ID is required"); return false; }
      if (!(formData.firstName || "").trim()) { setFormError("First name is required"); return false; }
      if (!(formData.lastName || "").trim()) { setFormError("Last name is required"); return false; }
    }
    if (step === 2) {
      if (!formData.sex) { setFormError("Sex is required"); return false; }
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
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Identity</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Adviser ID <span className="text-[var(--color-red-500)]">*</span></label>
              <input
                type="text"
                value={formData.adviserId}
                placeholder="e.g. ADV-0001"
                onChange={(e) => setFormData(prev => ({ ...prev, adviserId: e.target.value }))}
                className={inputCls}
                disabled={isEditMode}
              />
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

        {/* ─── STEP 2 — Personal Details ─── */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Personal Details</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Sex <span className="text-[var(--color-red-500)]">*</span></label>
              <select value={formData.sex} onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))} className={inputCls}>
                {sexOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
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
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Contact Number <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <input type="text" value={formData.contactNumber} maxLength={11} placeholder="e.g. 09XXXXXXXXX"
                onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))} className={inputCls} />
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
const AdminAdvisers = () => {
  const { setShowTokenExpiredModal } = useAuth();
  const navigate = useNavigate();

  // [STATES]
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "id-asc" | "id-desc">("name-asc");
  const [showSortFilters, setShowSortFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // [STATES] Show/hide dropdowns
  const [showSexFilters, setShowSexFilters] = useState(false);
  const [selectedSex, setSelectedSex] = useState<string | "All">("All");

  // [STATES] Adviser form modal
  const [showAdviserModal, setShowAdviserModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // [STATES] CrudModal — confirmations only (delete, errors)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => Promise<void>>(() => async () => {});

  const [formData, setFormData] = useState<FormData>({
    adviserId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nameExtension: "",
    sex: "MALE",
    birthDate: "",
    email: "",
    contactNumber: "",
  });

  // [STATES] Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // [FETCH] Advisers
  const fetchAdvisers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setShowTokenExpiredModal(true);
        return;
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch advisers");

      const list = data.data?.data;
      setAdvisers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setModalTitle("Error fetching advisers");
      setIsCancelable(true);
      setShowModal(true);
      setAdvisers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisers();
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

  // [HANDLE] Add adviser
  const handleAddAdviser = () => {
    setFormData({
      adviserId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      nameExtension: "",
      sex: "MALE",
      birthDate: "",
      email: "",
      contactNumber: "",
    });
    setIsEditMode(false);
    setFormError("");
    setShowAdviserModal(true);
  };

  // [HANDLE] Open edit
  const handleOpenEdit = (adviser: Adviser) => {
    setFormData({
      id: adviser.id,
      adviserId: adviser.adviserId,
      firstName: adviser.firstName,
      middleName: adviser.middleName || "",
      lastName: adviser.lastName,
      nameExtension: adviser.nameExtension || "",
      sex: adviser.sex || "MALE",
      birthDate: adviser.birthDate ? adviser.birthDate.split("T")[0] : "",
      email: adviser.email || "",
      contactNumber: adviser.contactNumber || "",
    });
    setIsEditMode(true);
    setFormError("");
    setShowAdviserModal(true);
  };

  // [HANDLE] Submit form (create or update)
  const handleSubmit = async () => {
    const dataToSubmit = {
      ...(isEditMode && { id: formData.id }),
      adviserId: formData.adviserId.trim(),
      firstName: formData.firstName.trim(),
      middleName: formData.middleName || null,
      lastName: formData.lastName.trim(),
      nameExtension: formData.nameExtension || null,
      sex: formData.sex,
      birthDate: formData.birthDate || null,
      email: formData.email || null,
      contactNumber: formData.contactNumber || null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(isEditMode ? [dataToSubmit] : dataToSubmit),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Operation failed");

      if (isEditMode) {
        const updated = data.data?.updated;
        if (updated && updated.length > 0) {
          await fetchAdvisers();
        } else {
          const failMsg = data.data?.failed?.[0]?.message;
          setFormError(failMsg || "Adviser update failed");
          return;
        }
      } else {
        const created = data.data?.created ?? data.data;
        if (created) {
          await fetchAdvisers();
        } else {
          const failMsg = data.data?.failed?.[0]?.message;
          setFormError(failMsg || "Adviser creation failed");
          return;
        }
      }

      setShowAdviserModal(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // [HANDLE] Delete adviser
  const handleDelete = (id: number) => {
    setModalTitle("Delete Adviser");
    setIsCancelable(true);
    setShowModal(true);

    const onDeleteConfirm = async () => {
      setShowModal(false);
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/advisers/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to delete adviser");
        setAdvisers(prev => prev.filter(a => a.id !== id));
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
  const filteredAdvisers = advisers
    .filter(a =>
      (
        (a.fullName && a.fullName.toLowerCase().includes(search.toLowerCase())) ||
        (a.adviserId && a.adviserId.toLowerCase().includes(search.toLowerCase())) ||
        (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
      ) &&
      (selectedSex === "All" || a.sex === selectedSex)
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return (a.fullName || "").localeCompare(b.fullName || "");
        case "name-desc": return (b.fullName || "").localeCompare(a.fullName || "");
        case "id-asc": return a.adviserId.localeCompare(b.adviserId);
        case "id-desc": return b.adviserId.localeCompare(a.adviserId);
        default: return 0;
      }
    });

  // [PAGINATION]
  const totalPages = Math.ceil(filteredAdvisers.length / itemsPerPage);
  const displayedAdvisers = filteredAdvisers.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  // *[BREADCRUMBS] Admin Dashboard navigation
  const breadcrumbs = [
    { label: "Admin Dashboard", path: "/admin/dashboard" },
    { label: "Advisers", path: null },
  ];

  return (
    <div>
      {/* [ADVISER FORM MODAL] */}
      <AdviserFormModal
        isOpen={showAdviserModal}
        title={isEditMode ? "Edit Adviser" : "Create Adviser"}
        onClose={() => setShowAdviserModal(false)}
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
          <h2 className="text-[var(--color-text-800)] leading-0">Advisers</h2>
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
              placeholder="Search by name, ID, or email..."
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
                <button onClick={() => { setSortOption("id-asc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "id-asc" ? "bg-blue-100" : ""}`}>ID ↑</button>
                <button onClick={() => { setSortOption("id-desc"); setShowSortFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${sortOption === "id-desc" ? "bg-blue-100" : ""}`}>ID ↓</button>
              </div>
            )}
          </div>

          {/* [DROPDOWN] Sex Filter */}
          <div className="relative">
            <button
              onClick={() => setShowSexFilters(!showSexFilters)}
              className="flex items-center justify-center text-[var(--color-text-50)] rounded-sm px-3 h-10 transition cursor-pointer bg-[var(--color-bg-50)] hover:opacity-80"
            >
              <img src="/filter-icon.svg" alt="Sex Filter" className="size-4" />
            </button>
            {showSexFilters && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg p-2 space-y-1 z-50">
                <button onClick={() => { setSelectedSex("All"); setPage(1); setShowSexFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedSex === "All" ? "bg-blue-100" : ""}`}>All</button>
                {sexOptions.map((option) => (
                  <button key={option.value} onClick={() => { setSelectedSex(option.value); setPage(1); setShowSexFilters(false); }} className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${selectedSex === option.value ? "bg-blue-100" : ""}`}>{option.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* [SECTION] Add Adviser */}
        <div className="mt-2 space-y-2">
          <PrimaryButton text="Add Adviser" iconSrc="/add-icon.svg" onClick={handleAddAdviser} />
        </div>

        {/* [CARDS] Advisers — Mobile View */}
        <div className="flex flex-col gap-4 sm:hidden mt-2 bg-[var(--color-bg-100)] px-3 py-4 rounded-lg">
          {displayedAdvisers.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/admin/advisers/view/${a.id}`)}
            >
              {/* Header */}
              <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
                <div className="flex items-center w-full gap-3 min-w-0">
                  {/* Initials Avatar */}
                  <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold px-4 text-xl border border-[var(--color-primary-200)] flex-shrink-0">
                    {a.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {/* Name + Adviser ID */}
                  <div className="flex-1 min-w-0">
                    <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">{a.fullName}</p>
                    <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
                      ID <span className="font-semibold text-[var(--color-text-700)]">{a.adviserId}</span>
                    </p>
                  </div>
                  {/* Sex Badge */}
                  <div className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                    a.sex === 'MALE' ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)]'
                    : a.sex === 'FEMALE' ? 'bg-[var(--color-red-100)] text-[var(--color-red-500)]'
                    : 'bg-[var(--color-bg-100)] text-gray-600'
                  }`}>
                    {a.sex === 'MALE' ? 'M' : a.sex === 'FEMALE' ? 'F' : '—'}
                  </div>
                </div>
              </div>
              {/* Details */}
              <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Email</span>
                  <span className="text-[var(--color-text-900)] truncate text-right max-w-[210px]">{a.email ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-700)] font-figree font-semibold">Sections</span>
                  <span className="text-[var(--color-text-900)]">{a.sections?.length ?? 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* [TABLE] Advisers — Desktop View */}
        <div className="hidden sm:block bg-[var(--color-bg-100)] rounded-lg overflow-hidden">
          <table className="w-full text-sm font-roboto">
            <thead>
              <tr className="border-b border-[var(--color-bg-200)] text-[var(--color-text-600)] text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Adviser</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Sex</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Sections</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedAdvisers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-600)]">No advisers found.</td>
                </tr>
              ) : (
                displayedAdvisers.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--color-bg-200)] hover:bg-[var(--color-bg-50)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/advisers/view/${a.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm flex-shrink-0">
                          {a.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-[var(--color-text-900)]">{a.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--color-text-600)] text-xs">{a.adviserId}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{a.sex === "MALE" ? "M" : a.sex === "FEMALE" ? "F" : "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{a.email ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-text-700)]">{a.sections?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="text-xs font-roboto text-[var(--color-primary-600)] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-xs font-roboto text-[var(--color-red-500)] hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* [SECTION] Pagination */}
        {displayedAdvisers.length !== 0 && (
          <div className="flex justify-center items-center mt-4 gap-4">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-50)] font-roboto font-bold transition-colors duration-150 ${
                page === 1 ? "bg-[var(--color-bg-400)] cursor-not-allowed opacity-50" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)]"
              }`}
            >
              &lt;
            </button>
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

export default AdminAdvisers;