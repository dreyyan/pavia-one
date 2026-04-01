/* eslint-disable react-hooks/set-state-in-effect */
// [IMPORT] Hooks
import { useState, useEffect } from "react";
import { AdviserFormData } from "../../types";

// [SHARED] Input class
const inputCls =
  "bg-[var(--color-bg-50)] font-roboto rounded-md py-2 px-3 border border-[var(--color-text-300)] outline-none focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm";

export const AdviserFormModal = ({
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
  if (!isOpen) return null;

  // [VALIDATE] Form before submit
  const validateStep = (): boolean => {
    setFormError("");

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

    if (!(formData.email || "").trim()) {
      setFormError("Email is required");
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!validateStep()) return;
    await onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-100)] rounded-lg p-6 w-full max-w-md shadow-lg">

        {/* [HEADER] Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text-900)]">
            {title}
          </h2>
        </div>

        {/* ─── FORM — Identity ─── */}
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
              className={inputCls}
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
                setFormData((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              className={inputCls}
            />
          </div>

          {/* [FIELD] Middle Name */}
          <div className="flex flex-col">
            <label className="font-roboto text-sm mb-1">
              Middle Name{" "}
              <span className="text-[var(--color-text-500)] text-xs">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={formData.middleName}
              placeholder="e.g. Santos"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  middleName: e.target.value,
                }))
              }
              className={inputCls}
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
                setFormData((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              className={inputCls}
            />
          </div>

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
                setFormData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className={inputCls}
            />
          </div>
        </div>

        {/* [ERROR] Form error message */}
        {formError && (
          <p className="text-[var(--color-red-500)] text-sm mt-3">
            {formError}
          </p>
        )}

        {/* [FOOTER] Cancel / Submit */}
        <div className="flex justify-between items-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-bg-100)] text-[var(--color-text-700)] hover:bg-[var(--color-bg-200)] transition-colors text-sm disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-roboto bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors text-sm disabled:opacity-60"
          >
            {loading ? "Processing..." : "Create"}
          </button>
        </div>

      </div>
    </div>
  );
};