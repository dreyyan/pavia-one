interface SchoolFormCardProps {
  id: number;
  name: string;
  schoolYear?: string;
  color: string;
}

const SchoolFormCard: React.FC<SchoolFormCardProps> = ({
  id,
  name,
  schoolYear,
  color,
}) => {
  return (
    <div className="rounded-lg shadow-md text-[var(--color-text-50)] font-roboto overflow-hidden">
      <div style={{ backgroundColor: color }} className="p-4">
        <div className="">
          <p className="text-lg font-bold">{name}</p>
          {schoolYear && <p className="text-xs opacity-90">SY {schoolYear}</p>}
        </div>
      </div>

      <div className="px-3 py-2 bg-[var(--color-bg-50)] flex gap-2 rounded-b-lg">
        {/* Actions as buttons */}
        <button
          onClick={() => window.location.href = `/forms/${id}/view`}
          style={{ backgroundColor: color }}
          className="font-figtree hover:bg-[var(--color-primary-700)] text-[var(--color-text-50)] font-bold py-1 px-3 rounded text-sm transition hover:opacity-90"
        >
          View
        </button>
        <button
          onClick={() => window.location.href = `/forms/${id}/export`}
          className="flex items-center gap-x-1 font-figtree bg-[var(--color-bg-100)] hover:bg-[var(--color-bg-200)] text-[var(--color-text-900)] leading-5 py-1 px-3 rounded font-medium text-xs transition"
        >
          Export
          <img src="/export-icon.svg" className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default SchoolFormCard;