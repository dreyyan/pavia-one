import React from "react";

interface TabbedFormCardProps {
  labels: string[];
  activePage: number;
  setActivePage: (page: number) => void;
  isEditing: boolean;
  loading?: boolean;
  onSave?: () => void;
  onToggleEdit: () => void;
  children: React.ReactNode;
}

const TabbedFormCard: React.FC<TabbedFormCardProps> = ({
  labels,
  activePage,
  setActivePage,
  isEditing,
  loading,
  onSave,
  onToggleEdit,
  children,
}) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-4">
      <div className="flex gap-1 bg-[var(--color-bg-200)] rounded-lg p-1">
        {labels.map((label, idx) => (
          <button
            key={idx}
            onClick={() => setActivePage(idx)}
            className={`flex-1 text-xs sm:text-sm font-roboto font-medium sm:font-semibold py-1 sm:py-3 px-2 rounded-md transition-all duration-150 cursor-pointer ${
              activePage === idx
                ? "bg-[var(--color-bg-50)] text-[var(--color-text-900)] shadow-sm"
                : "text-[var(--color-text-600)] hover:text-[var(--color-text-800)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-t border-[var(--color-bg-200)]" />

      <div className="flex items-center justify-between">
        <span className="form-section-title">{labels[activePage]}</span>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={onSave}
              disabled={loading}
              className="flex items-center gap-1 btn-action font-bold text-[var(--color-text-50)] bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)]"
            >
              <img
                src="/save-icon.svg"
                alt="Save"
                className="w-3.5 h-3.5"
              />
              Save
            </button>
          )}

          <button
            onClick={onToggleEdit}
            disabled={loading}
            className={`flex items-center gap-1 btn-action ${
              isEditing
                ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                : "font-semibold text-[var(--color-text-50)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)]"
            }`}
          >
            {isEditing ? (
              "Cancel"
            ) : (
              <>
                <img
                  src="/edit-icon.svg"
                  alt="Edit"
                  className="w-3.5 h-3.5"
                />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {children}
    </div>
  );
};

export default TabbedFormCard;