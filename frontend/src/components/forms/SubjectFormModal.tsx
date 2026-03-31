/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";

// ? [CONSTANTS]
const semesterOptions = ["1st Semester", "2nd Semester", "Full Year"];
const gradeLevelOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const TOTAL_STEPS = 2;
const inputCls = "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm";

// ? [TYPE]
type FormData = {
  id?: number;
  code: string;
  name: string;
  gradeLevel: string;
  semester: string;
  hoursPerWeek: string;
  description: string;
};

const SubjectFormModal = ({
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
      if (!(formData.code || "").trim()) { setFormError("Subject code is required"); return false; }
      if (!(formData.name || "").trim()) { setFormError("Subject name is required"); return false; }
      if (!formData.gradeLevel) { setFormError("Grade level is required"); return false; }
    }
    return true;
  };

  // [HANDLE] Navigation buttons
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

        {/* [STEP 1] Identity */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Subject Identity</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Subject Code <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" value={formData.code} placeholder="e.g. MATH-7"
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Subject Name <span className="text-[var(--color-red-500)]">*</span></label>
              <input type="text" value={formData.name} placeholder="e.g. Mathematics"
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Grade Level <span className="text-[var(--color-red-500)]">*</span></label>
              <select value={formData.gradeLevel} onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))} className={inputCls}>
                <option value="" disabled>Select grade level</option>
                {gradeLevelOptions.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* [STEP 2] Personal Details */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">Details</p>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Semester <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <select value={formData.semester} onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))} className={inputCls}>
                <option value="">None</option>
                {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Hours per Week <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <input type="number" min="0" max="40" value={formData.hoursPerWeek} placeholder="e.g. 5"
                onChange={(e) => setFormData(prev => ({ ...prev, hoursPerWeek: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Description <span className="text-[var(--color-text-500)] text-xs">(optional)</span></label>
              <textarea value={formData.description} placeholder="Brief description of the subject..."
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`${inputCls} resize-none`} rows={3} />
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

export default SubjectFormModal;