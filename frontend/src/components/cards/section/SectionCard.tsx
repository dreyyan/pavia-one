// [IMPORT] Libraries
import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Sub-components
import Badge from "../../badges/Badge";
import Avatar from "../../badges/Avatar";

// [IMPORT] Helpers & Types
import { getGradeAvatarColor } from "../../../helpers";
import type { Section } from "../../../types";

interface SectionCardProps {
  section: Section;
  onClick?: (sectionId: number) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick(section.id);
    else navigate(`/admin/sections/view/${section.id}`);
  };

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* [HEADER] Grade + Name */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          <Avatar
            label={`${section.gradeLevel}`}
            color={getGradeAvatarColor(Number(section.gradeLevel))}
          />

          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {section.name}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {section.schoolYear}
            </p>
          </div>
        </div>
      </div>

      {/* [DETAILS] */}
      <div className="px-4 py-3 space-y-2 text-sm">
        {/* Students */}
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Students
          </span>
          <span className="text-[var(--color-text-900)] font-semibold">
            {section.classSize}
          </span>
        </div>

        {/* Adviser */}
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Adviser
          </span>

          <div className="flex justify-end min-w-0">
            {section.adviser ? (
              <span className="text-[var(--color-text-900)] font-semibold truncate">
                {section.adviser.name}
              </span>
            ) : (
              <Badge label="Unassigned" color="red" />
            )}
          </div>
        </div>

        {/* Curriculum */}
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Curriculum
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
            {section.curriculum}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;