/* eslint-disable react-hooks/exhaustive-deps */
// [IMPORT] Hooks
import { useState, useEffect } from "react";

// [IMPORT] Contants & Types
import { gradeLevelOptions, curriculumOptions, weightPresets } from "../../constants";
import { LearningAreaFormData } from "../../types";

// ? [CONSTANTS]
const TOTAL_STEPS = 3;
const inputCls = "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm";

// *[COMPONENT] Weight Preset Pill
const WeightPresetPill = ({
  preset,
  active,
  onClick,
}: {
  preset: typeof weightPresets[number];
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-roboto font-medium border transition-colors cursor-pointer ${
      active
        ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
        : "bg-[var(--color-bg-50)] text-[var(--color-text-700)] border-[var(--color-text-300)] hover:border-[var(--color-primary-400)]"
    }`}
  >
    {preset.label}
  </button>
);

// *[COMPONENT] Weight Input Row
const WeightRow = ({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-roboto text-[var(--color-text-900)]">{label}</span>
      <span className="text-xs font-roboto text-[var(--color-text-500)]">{hint}</span>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <input
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputCls} w-20 text-right disabled:opacity-60 disabled:cursor-not-allowed`}
      />
      <span className="text-xs font-roboto text-[var(--color-text-500)] w-8">
        {value ? `${Math.round(Number(value) * 100)}%` : "—"}
      </span>
    </div>
  </div>
);

// *[PAGE] Subject Form Modal
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
  formData: LearningAreaFormData;
  setFormData: React.Dispatch<React.SetStateAction<LearningAreaFormData>>;
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

  // [COMPUTED] Weight sum for live validation
  const weightSum =
    (Number(formData.writtenWorkWeight) || 0) +
    (Number(formData.performanceTaskWeight) || 0) +
    (Number(formData.quarterlyAssessmentWeight) || 0);

  const weightsAreValid = Math.abs(weightSum - 1.0) < 0.001;

  // [VALIDATE] Per-step before advancing
  const validateStep = (): boolean => {
    setFormError("");

    if (step === 1) {
      if (!(formData.name || "").trim()) { setFormError("Subject name is required"); return false; }
      if (!formData.gradeLevel) { setFormError("Grade level is required"); return false; }
    }

    if (step === 2) {
      if (!formData.curriculum) { setFormError("Curriculum is required"); return false; }
    }

    if (step === 3) {
      if (!formData.writtenWorkWeight || !formData.performanceTaskWeight || !formData.quarterlyAssessmentWeight) {
        setFormError("All three component weights are required"); return false;
      }
      if (!weightsAreValid) {
        setFormError(`Weights must sum to 100%. Current total: ${Math.round(weightSum * 100)}%`);
        return false;
      }
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

  // [HANDLE] Apply weight preset
  const applyPreset = (preset: typeof weightPresets[number]) => {
    setFormData(prev => ({
      ...prev,
      writtenWorkWeight: String(preset.ww),
      performanceTaskWeight: String(preset.pt),
      quarterlyAssessmentWeight: String(preset.qa),
    }));
    setFormError("");
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

        {/* ─── STEP 1 — Identity ─── */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Subject Identity
            </p>

            {/* [INPUT] Subject Name */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Subject Name <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                placeholder="e.g. Mathematics, Filipino, Science"
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* [SELECT] Grade Level */}
            <div className="flex flex-col">
              <label className="font-roboto text-sm mb-1">
                Grade Level <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                className={inputCls}
                disabled={isEditMode}
              >
                <option value="" disabled>Select grade level</option>
                {gradeLevelOptions.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
              {/* [HINT] Locked in edit mode — grade level is part of the unique constraint */}
              {isEditMode && (
                <p className="text-xs font-roboto text-[var(--color-text-500)] mt-1">
                  Grade level cannot be changed after creation.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 2 — Curriculum ─── */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)] mb-1">
              Curriculum
            </p>

            {/* [RADIO GROUP] Curriculum options */}
            <div className="flex flex-col gap-2">
              {curriculumOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.curriculum === opt.value
                      ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                      : "border-[var(--color-bg-300)] bg-[var(--color-bg-50)] hover:border-[var(--color-primary-300)]"
                  } ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="curriculum"
                    value={opt.value}
                    checked={formData.curriculum === opt.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, curriculum: e.target.value }))}
                    disabled={isEditMode}
                    className="mt-0.5 accent-[var(--color-primary-600)]"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-roboto font-semibold text-[var(--color-text-900)]">
                      {opt.label}
                    </span>
                    <span className="text-xs font-roboto text-[var(--color-text-500)]">
                      {opt.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* [HINT] Locked in edit mode — curriculum is part of the unique constraint */}
            {isEditMode && (
              <p className="text-xs font-roboto text-[var(--color-text-500)]">
                Curriculum cannot be changed after creation.
              </p>
            )}
          </div>
        )}

        {/* ─── STEP 3 — Grading Weights ─── */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
                Grading Component Weights
              </p>
              <p className="text-xs font-roboto text-[var(--color-text-500)] mt-0.5">
                Written Work + Performance Task + Quarterly Assessment must equal 100%.
              </p>
            </div>

            {/* [UI] Weight preset pills */}
            <div>
              <p className="text-xs font-roboto text-[var(--color-text-600)] mb-1.5">Quick presets (WW / PT / QA)</p>
              <div className="flex flex-wrap gap-2">
                {weightPresets.map((preset) => {
                  const isActive =
                    formData.writtenWorkWeight === String(preset.ww) &&
                    formData.performanceTaskWeight === String(preset.pt) &&
                    formData.quarterlyAssessmentWeight === String(preset.qa);
                  return (
                    <WeightPresetPill
                      key={preset.label}
                      preset={preset}
                      active={isActive}
                      onClick={() => applyPreset(preset)}
                    />
                  );
                })}
              </div>
            </div>

            {/* [DIVIDER] */}
            <div className="border-t border-[var(--color-bg-200)]" />

            {/* [INPUTS] Individual weight fields */}
            <div className="flex flex-col gap-3">
              <WeightRow
                label="Written Work"
                hint="e.g. quizzes, seatwork, homework"
                value={formData.writtenWorkWeight}
                onChange={(v) => setFormData(prev => ({ ...prev, writtenWorkWeight: v }))}
              />
              <WeightRow
                label="Performance Task"
                hint="e.g. projects, experiments, recitation"
                value={formData.performanceTaskWeight}
                onChange={(v) => setFormData(prev => ({ ...prev, performanceTaskWeight: v }))}
              />
              <WeightRow
                label="Quarterly Assessment"
                hint="quarterly exam / summative test"
                value={formData.quarterlyAssessmentWeight}
                onChange={(v) => setFormData(prev => ({ ...prev, quarterlyAssessmentWeight: v }))}
              />
            </div>

            {/* [UI] Live weight sum indicator */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-roboto font-medium ${
              weightsAreValid
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              <span>Total</span>
              <span>{Math.round(weightSum * 100)}% {weightsAreValid ? "✓" : `— needs ${Math.round((1 - weightSum) * 100)}% more`}</span>
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
              disabled={loading || !weightsAreValid}
              className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : isEditMode ? "Update" : "Create"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SubjectFormModal;