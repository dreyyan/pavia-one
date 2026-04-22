// [IMPORT] React
import React from "react";

// [IMPORT] Types
import type { Section } from "../../types";

interface SectionInfoCardProps {
  section: Section;
  totalStudents: number;
}

const SectionInfoCard: React.FC<SectionInfoCardProps> = ({
  section,
  totalStudents,
}) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg border border-[var(--color-bg-200)] overflow-hidden">
      <div className="bg-[var(--color-bg-50)] border-b border-[var(--color-bg-200)] px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border border-[var(--color-primary-200)] flex-shrink-0">
            {section.gradeLevel}
          </div>
          <div>
            <h3 className="font-roboto font-bold text-[var(--color-text-900)] text-base leading-tight">
              Grade {section.gradeLevel} — {section.name}
            </h3>
            <p className="text-xs text-[var(--color-text-500)] mt-0.5 font-roboto">
              {section.schoolYear} · {section.curriculum} Curriculum
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-roboto">
        <div>
          <p className="text-xs text-[var(--color-text-500)] uppercase tracking-wide mb-0.5">
            Adviser
          </p>
          <p className="font-semibold text-[var(--color-text-800)]">
            {section.adviser?.name ?? "—"}
          </p>
          <p className="text-xs text-[var(--color-text-400)]">
            {section.adviser?.email ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-[var(--color-text-500)] uppercase tracking-wide mb-0.5">
            School Year
          </p>
          <p className="font-semibold text-[var(--color-text-800)] font-mono">
            {section.schoolYear}
          </p>
        </div>

        <div>
          <p className="text-xs text-[var(--color-text-500)] uppercase tracking-wide mb-0.5">
            Total Students
          </p>
          <p className="font-semibold text-[var(--color-text-800)]">
            {totalStudents}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectionInfoCard;