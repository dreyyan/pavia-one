interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  label?: string;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClear,
  onDelete,
  label = "selected",
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-[var(--color-bg-50)] rounded-md border border-[var(--color-bg-200)]">
      <div className="flex items-center gap-1">
        <span className="text-sm font-roboto font-semibold text-[var(--color-text-800)]">
          {selectedCount}
        </span>
        <span className="text-sm font-roboto text-[var(--color-text-600)]">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDelete}
          className="text-sm font-roboto font-medium text-[var(--color-red-500)] hover:text-[var(--color-red-600)] transition cursor-pointer"
        >
          Delete
        </button>

        <div className="w-px h-4 bg-[var(--color-bg-200)]" />

        <button
          onClick={onClear}
          className="text-sm font-roboto font-medium text-[var(--color-text-600)] hover:text-[var(--color-text-800)] transition cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;