// [IMPORT] Hooks
import { useState, useEffect } from "react";

// [IMPORT] Types
import { AdviserFormData } from "../../types";

// [SHARED] Input class
const TOTAL_STEPS = 2;

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
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  formData: AdviserFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdviserFormData>>;
  loading: boolean;
  formError: string;
  setFormError: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [step, setStep] = useState(1);

  // * [EFFECT] Reset to step 1 whenever opened
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setStep(1), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // [VALIDATE] Form fields per step before navigating or submitting
  const validateStep = (): boolean => {
    setFormError("");

    if (step === 1) {
      if (!(formData.adviserId || "").trim()) {
        setFormError("Adviser ID is required");
        return false;
      }
      if ((formData.adviserId || "").trim().length > 8) {
        setFormError("Adviser ID must be at most 8 characters");
        return false;
      }
      if (!(formData.firstName || "").trim()) {
        setFormError("First name is required");
        return false;
      }
      if (!(formData.lastName || "").trim()) {
        setFormError("Last name is required");
        return false;
      }
    }

    if (step === 2) {
      if (!(formData.email || "").trim()) {
        setFormError("Email is required");
        return false;
      }
      if (!(formData.password || "").trim()) {
        setFormError("Password is required");
        return false;
      }
    }

    return true;
  };

  // [HANDLE] Navigation buttons
  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };
  const handleBack = () => {
    setFormError("");
    setStep((s) => Math.max(s - 1, 1));
  };
  const handleConfirm = async () => {
    if (!validateStep()) return;
    await onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-100)] rounded-lg p-6 w-full max-w-md shadow-lg">

        {/* [HEADER] Title + Step Counter */}
        <div className="flex items-center justify-between mb-1">
          <span className="form-title">{title}</span>
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
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Identity
            </p>

            {/* [FIELD] Adviser ID */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Adviser ID <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="text"
                value={formData.adviserId || ""}
                placeholder="e.g. 12345678"
                maxLength={8}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    adviserId: e.target.value.toUpperCase().slice(0, 8),
                  }))
                }
                className="input-base"
              />
            </div>

            {/* [FIELD] First Name */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                First Name <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                placeholder="e.g. Juan"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                className="input-base"
              />
            </div>

            {/* [FIELD] Middle Name */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Middle Name{" "}
                <span className="text-[var(--color-text-500)] text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.middleName}
                placeholder="e.g. Santos"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, middleName: e.target.value }))
                }
                className="input-base"
              />
            </div>

            {/* [FIELD] Last Name */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Last Name <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                placeholder="e.g. dela Cruz"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="input-base"
              />
            </div>
          </div>
        )}

        {/* [STEP 2] Account */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Account
            </p>

            {/* [FIELD] Email */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Email <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                placeholder="e.g. juan@school.edu.ph"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="input-base"
              />
            </div>

            {/* [FIELD] Password */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Password <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="password"
                value={formData.password || ""}
                placeholder="Set a temporary password"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="input-base"
              />
            </div>
          </div>
        )}

        {/* [ERROR] Form error message */}
        {formError && (
          <p className="text-[var(--color-red-500)] text-sm mt-3">{formError}</p>
        )}

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
              {loading ? "Processing..." : "Create"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdviserFormModal;