// [IMPORT] Libraries
import React from "react";

// [IMPORT] Types
import type { AdviserDetails } from "../../types";

// ? [TYPE] Section shape from AdviserDetails
type Section = AdviserDetails["sections"][number];

interface AssignedSectionsCardProps {
  sections: Section[];
}

// [SUB-COMPONENT] Advisory badge pill
const AdvisoryBadge = () => (
  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
    Advisory
  </span>
);

// [COMPONENT]
const AssignedSectionsCard: React.FC<AssignedSectionsCardProps> = ({ sections }) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3">
      <p className="form-section-title">Assigned Sections</p>

      {sections.length === 0 ? (
        <p className="text-sm font-roboto text-[var(--color-text-600)]">
          No sections assigned.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map(section => (
            <div
              key={section.id}
              className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-roboto font-semibold text-[var(--color-text-900)] truncate">
                  {section.name}
                </p>
                <p className="text-xs font-roboto text-[var(--color-text-600)]">
                  Grade {section.gradeLevel} · {section.curriculum} · {section.schoolYear}
                </p>
                <p className="text-xs font-roboto text-[var(--color-text-500)]">
                  {section.classSize} students
                </p>
              </div>
              <AdvisoryBadge />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedSectionsCard;