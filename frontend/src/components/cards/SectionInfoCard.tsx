// [IMPORT] React
import React from "react";

// [IMPORT] Types
import type { Section } from "../../types";

// [IMPORT] Helpers
import { getGradeColor } from "../../helpers/index";

interface SectionInfoCardProps {
  section: Section;
  totalStudents: number;
}

const SectionInfoCard: React.FC<SectionInfoCardProps> = ({
  section,
  totalStudents,
}) => {
  // [DERIVED] Grade styling (consistent with SectionFormCard)
  const colors = getGradeColor(Number(section.gradeLevel));

  return (
    <div className="bg-white rounded-xl border-2 border-[var(--color-bg-200)] overflow-hidden transition-all duration-200">
      {/* [CARD] Header */}
      <div className="bg-[var(--color-bg-50)] px-3 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Grade badge (consistent style) */}
          <div
            className={`size-10 rounded-md flex items-center justify-center font-bold text-sm border flex-shrink-0 ${colors.badge}`}
          >
            {section.gradeLevel}
          </div>

          {/* [UI] Title block */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-base leading-tight truncate">
              Grade {section.gradeLevel} — {section.name}
            </p>
            <p className="text-xs text-[var(--color-text-500)] mt-0.5">
              {section.schoolYear} · {section.curriculum} Curriculum
            </p>
          </div>
        </div>
      </div>

      {/* [CARD] Body */}
      <div className="px-4 py-3 space-y-3 text-sm font-roboto">
        {/* Adviser */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">
            Adviser
          </span>
          <div className="text-right">
            <p
              className={`${
                !section?.adviser?.name
                  ? "text-[var(--color-secondary-500)] italic"
                  : "text-[var(--color-text-900)] font-semibold"
              }`}
            >
              {section?.adviser?.name ?? "Unassigned"}
            </p>
            <p className="text-xs text-[var(--color-text-500)]">
              {section?.adviser?.email ?? "—"}
            </p>
          </div>
        </div>

        {/* School Year */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">
            School Year
          </span>
          <span className="font-semibold text-[var(--color-text-900)] font-mono">
            {section.schoolYear}
          </span>
        </div>

        {/* Curriculum */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">
            Curriculum
          </span>
          <span className="text-[var(--color-text-900)]">
            {section.curriculum}
          </span>
        </div>

        {/* Students */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">
            Total Students
          </span>
          <span className="font-semibold text-[var(--color-text-900)]">
            {totalStudents}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SectionInfoCard;