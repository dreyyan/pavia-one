// [IMPORT] Hooks
import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers & Types
import { formatName, getGradeColor } from "../../helpers";
import type { Adviser } from "../../types";

interface AdviserCardProps {
  adviser: Adviser;
  onClick?: (adviserId: number) => void;
}

const AdviserCard: React.FC<AdviserCardProps> = ({ adviser: a, onClick }) => {
  const navigate = useNavigate();
  const firstSection = a.sections?.[0];
  const colors = firstSection
    ? getGradeColor(Number(firstSection.gradeLevel))
    : getGradeColor(0);

  const initials = a.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // [HANDLE] Navigate to adviser detials
  const handleClick = () => {
    if (onClick) onClick(a.id);
    else navigate(`/admin/advisers/view/${a.id}`);
  };

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* [HEADER] Avatar, Name & ID */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Initials Avatar */}
          <div className={`size-10 rounded-md flex items-center justify-center bg-[var(--color-bg-100)] text-[var(--color-bg-700)] border border-[var(--color-bg-200)] font-bold text-sm flex-shrink-0 ${colors.badge}`}>
            {initials}
          </div>

          {/* [TEXT] Name + Adviser ID */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {formatName(a.name)}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              #{a.adviserId}
            </p>
          </div>
        </div>
      </div>

      {/* [DETAILS] Fields */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Email
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
            {a.email}
          </span>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Assigned Section
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
            {a.sections?.length
              ? `Grade ${a.sections[0].gradeLevel} – ${a.sections[0].name}`
              : "None"}
          </span>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Sections
          </span>
          <span className="text-[var(--color-text-900)] font-semibold">
            {a.sectionCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdviserCard;