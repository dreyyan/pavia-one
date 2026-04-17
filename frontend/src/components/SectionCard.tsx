import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers
import { getGradeColor } from "../helpers";

export interface Section {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  color?: string;
  curriculum?: string;
  adviser?: { name: string } | null;
}

interface SectionCardProps {
  section: Section;
  onClick?: (sectionId: number) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, onClick }) => {
  const navigate = useNavigate();
  const colors = getGradeColor(section.gradeLevel);

  const handleClick = () => {
    if (onClick) onClick(section.id);
    else navigate(`/admin/sections/view/${section.id}`);
  };

  return (
    <div
      className="bg-[var(--color-bg-100)] rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          
          {/* Grade badge */}
          <div
            className={`size-10 rounded-md flex items-center justify-center font-bold text-xl border flex-shrink-0 ${colors.badge}`}
          >
            {section.gradeLevel}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {section.name}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {section.schoolYear}
            </p>
          </div>
        </div>

        {!section.adviser && (
          <span
            className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold ${colors.badge}`}
          >
            No Adviser
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-2 text-sm bg-[var(--color-bg-50)]">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Curriculum
          </span>
          <span className="text-[var(--color-text-900)]">{section.curriculum}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Adviser
          </span>
          <span
            className={`truncate text-right max-w-[180px] ${
              !section.adviser
                ? "text-amber-600 italic"
                : "text-[var(--color-text-900)]"
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