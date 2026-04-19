// [IMPORT] Hooks
import { useState, useEffect, useRef } from "react";

// [IMPORT] Constants & Types
import { CURRICULUM_OPTIONS, GRADE_LEVEL_OPTIONS, LEARNING_MODALITY_OPTIONS } from "../../constants";
import { SectionFormData } from "../../types";

const TOTAL_STEPS = 3;

// ? [INTERFACE] Adviser shape
interface Adviser {
  id: number;
  adviserId: string;
  name: string;
}

const SectionFormModal = ({
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
  formData: SectionFormData;
  setFormData: React.Dispatch<React.SetStateAction<SectionFormData>>;
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

  // [VALIDATE] Per-step before advancing or submitting
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
    if (step === 3) {
      if (!formData.adviserId) { setFormError("Please select an adviser"); return false; }
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

  // [FILTER] Advisers by name or ID
  const filteredAdvisers = advisers.filter(a =>
    a.name.toLowerCase().includes(adviserSearch.toLowerCase()) ||
    a.adviserId.includes(adviserSearch)
  );

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

        {/* [STEP 1] Section Identity */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Section Identity
            </p>

            {/* [FIELD] Section Name */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Section Name <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                placeholder="e.g. Rizal, Mabini"
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-base"
              />
            </div>

            {/* [FIELD] Grade Level */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Grade Level <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                className="input-base"
              >
                <option value="" disabled>Select grade level</option>
                {GRADE_LEVEL_OPTIONS.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            {/* [FIELD] School Year */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                School Year <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="text"
                value={formData.schoolYear}
                placeholder="e.g. 2024 - 2025"
                onChange={(e) => setFormData(prev => ({ ...prev, schoolYear: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
        )}

        {/* [STEP 2] Configuration */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Configuration
            </p>

            {/* [FIELD] Curriculum */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Curriculum <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <select
                value={formData.curriculum || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, curriculum: e.target.value }))}
                className="input-base"
              >
                <option value="" disabled>Select curriculum</option>
                {CURRICULUM_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* [FIELD] Learning Modality */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">Learning Modality</label>
              <select
                value={formData.learningModality || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, learningModality: e.target.value }))}
                className="input-base"
              >
                {LEARNING_MODALITY_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* [FIELD] Room */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Room <span className="text-[var(--color-text-500)] text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.room || ""}
                placeholder="e.g. Room 101"
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                className="input-base"
              />
            </div>

            {/* [FIELD] Section Color */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Section Color <span className="text-[var(--color-text-500)] text-xs">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {/* [COLOR] Native color picker — clicking the swatch opens the browser picker */}
                <div className="relative flex-shrink-0">
                  <input
                    type="color"
                    value={formData.color || "#6366f1"}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="size-9 rounded-md border-2 border-[var(--color-text-300)] cursor-pointer transition-shadow hover:shadow-md"
                    style={{ backgroundColor: formData.color || "#6366f1" }}
                  />
                </div>

                {/* [HEX] Text input — synced with the color picker */}
                <input
                  type="text"
                  value={formData.color || ""}
                  placeholder="#6366f1"
                  maxLength={7}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  onBlur={(e) => {
                    // [NORMALIZE] Ensure stored value is valid hex; reset to empty if not
                    const isValid = /^#[0-9A-Fa-f]{6}$/.test(e.target.value);
                    if (!isValid) setFormData(prev => ({ ...prev, color: "" }));
                  }}
                  className="input-base flex-1 font-mono"
                />

                {/* [CLEAR] Remove color */}
                {formData.color && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: "" }))}
                    className="text-xs text-[var(--color-text-400)] hover:text-[var(--color-red-500)] cursor-pointer transition-colors"
                    title="Clear color"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-400)] mt-1">
                Used to visually distinguish this section in lists and calendars.
              </p>
            </div>
          </div>
        )}

        {/* [STEP 3] Adviser */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Adviser
            </p>

            {/* [FIELD] Adviser searchable dropdown */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Adviser <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <div ref={adviserDropdownRef} className="relative">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={adviserSearch}
                  onFocus={() => setShowAdviserDropdown(true)}
                  onChange={(e) => {
                    setAdviserSearch(e.target.value);
                    setFormData(prev => ({ ...prev, adviserId: "", adviserName: "" }));
                    setShowAdviserDropdown(true);
                  }}
                  className="input-base w-full"
                />
                {showAdviserDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto">
                    {filteredAdvisers.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">No advisers found</p>
                    ) : (
                      filteredAdvisers.map(adviser => (
                        <button
                          key={adviser.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              adviserId: adviser.adviserId,
                              adviserName: adviser.name,
                            }));
                            setAdviserSearch(adviser.name);
                            setShowAdviserDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-100)] transition-colors ${
                            formData.adviserId === adviser.adviserId
                              ? "bg-blue-50 text-[var(--color-primary-700)]"
                              : "text-[var(--color-text-900)]"
                          }`}
                        >
                          <span className="font-medium">{adviser.name}</span>
                          <span className="ml-2 text-xs text-gray-400">#{adviser.adviserId}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* [INFO] Selected adviser confirmation */}
            {formData.adviserId && (
              <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-300)] rounded-md px-3 py-2 text-sm font-roboto text-[var(--color-text-700)]">
                <span className="font-semibold text-[var(--color-text-900)]">Assigned Adviser: </span>
                {formData.adviserName}
                <p className="text-xs text-[var(--color-text-500)] mt-0.5">
                  This adviser will be set as the section adviser.
                </p>
              </div>
            )}
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
              {loading ? "Processing..." : isEditMode ? "Update" : "Create"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SectionFormModal;