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

      {/* [UI] Page tabs */}
      <div className="flex gap-1 bg-[var(--color-bg-200)] rounded-lg p-1">
        {labels.map((label, idx) => (
          <button
            key={idx}
            onClick={() => setActivePage(idx)}
            className={`flex-1 text-xs font-roboto font-medium py-1.5 px-2 rounded-md transition-all duration-150 cursor-pointer ${
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

      {/* [HEADER] Section title + Edit / Save buttons */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-roboto font-semibold uppercase tracking-wide text-[var(--color-text-600)]">
          {labels[activePage]}
        </span>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={onSave}
              disabled={loading}
              className="text-xs font-roboto font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}

          <button
            onClick={onToggleEdit}
            disabled={loading}
            className={`text-xs font-roboto font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isEditing
                ? "text-[var(--color-text-50)] bg-[var(--color-red-700)] hover:bg-[var(--color-red-800)]"
                : "text-[var(--color-text-50)] bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)]"
            }`}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* [FORM] Dynamic fields based on active page */}
      {children}
    </div>
  );
};

export default TabbedFormCard;