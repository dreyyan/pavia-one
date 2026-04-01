// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";
import { LEARNING_MODALITY_OPTIONS, SEX_OPTIONS } from "../../constants";

const inputCls = "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm";

const TOTAL_CREATE_STEPS = 3;
const TOTAL_EDIT_STEPS = 2;

// ? [INTERFACES]
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

// ? [TYPE] Form data for create/edit student
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

  // * [EFFECT] Reset to step 1 whenever opened
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setStep(1), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // * [EFFECT] Close adviser dropdown on outside click
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

  // [HANDLE] Validate current step before navigating or submitting
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

  // [HANDLE] Navigation buttons
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

  // [HANDLE] Filter advisers based on search input (name or ID)
  const filteredAdvisers = advisers.filter(a =>
    a.name.toLowerCase().includes(adviserSearch.toLowerCase()) ||
    a.adviserId.includes(adviserSearch)
  );

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

        {/* [STEP 1] Identity */}
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

        {/* [STEP 2] Personal Details */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Personal Details</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Sex <span className="text-[var(--color-red-500)]">*</span></label>
              <select value={formData.sex} onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))} className={inputCls}>
              {SEX_OPTIONS.map((option) => (
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

        {/* [STEP 3] Enrollment (create only) */}
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
                {LEARNING_MODALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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

export default StudentFormModal;