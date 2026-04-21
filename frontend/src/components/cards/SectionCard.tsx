// [IMPORT] Libraries
import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers
import { getGradeColor } from "../../helpers";

import type { Section } from "../../types";

interface SectionCardProps {
  section: Section;
  onClick?: (sectionId: number) => void;
}

// [COMPONENT]
const SectionCard: React.FC<SectionCardProps> = ({ section, onClick }) => {
  const navigate = useNavigate();
  const colors = getGradeColor(Number(section.gradeLevel));

  const handleClick = () => {
    if (onClick) onClick(section.id);
    else navigate(`/admin/sections/view/${section.id}`);
  };

  return (
    <div
      className="w-full min-w-0 bg-[var(--color-bg-100)] rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* [HEADER] Grade Badge, Name & School Year */}
      <div className="px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Grade Level Badge */}
          <div
            className={`size-10 rounded-md flex items-center justify-center font-bold text-xl border flex-shrink-0 ${colors.badge}`}
          >
            {section.gradeLevel}
          </div>

          {/* [TEXT] Name + School Year */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {section.name}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {section.schoolYear}
            </p>
          </div>
        </div>

        {/* [BADGE] No Adviser warning */}
        {!section.adviser && (
          <span
            className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold text-[var(--color-red-600)] bg-[var(--color-red-50)] border-[var(--color-red-300)] italic`}
          >
            No Adviser
          </span>
        )}
      </div>

      {/* [DETAILS] Curriculum & Adviser */}
      <div className="px-4 py-3 space-y-2 text-sm bg-[var(--color-bg-50)]">
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Curriculum
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
            {section.curriculum}
          </span>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Adviser
          </span>
          <span
            className={`truncate text-right max-w-[180px] min-w-0 ${
              !section.adviser
                ? "text-[var(--color-red-600)] italic"
                : "text-[var(--color-text-900)] font-semibold"
            }`}
          >
            {section.adviser?.name ?? "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;