// [IMPORT] Hooks
import React from "react";

// [IMPORT] Sub-components
import AdvisoryBadge from "../../badges/AdvisoryBadge";

// [IMPORT] Types
import type { AdviserDetails } from "../../../types";

// ? [TYPE] Section shape from AdviserDetails
type Section = AdviserDetails["sections"][number];

interface AssignedSectionsCardProps {
  sections: Section[];
}

const AssignedSectionsCard: React.FC<AssignedSectionsCardProps> = ({ sections }) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-3 shadow">
      <p className="form-section-title">
        Assigned Sections <span className="form-section-value">({sections.length})</span>
      </p>

      {sections.length === 0 ? (
        <p className="text-sm font-roboto text-[var(--color-text-600)]">
          No sections assigned.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
          {sections.map(section => (
            // [COMPONENT] Assigned Section Card
            <div
              key={section.id}
              className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                {/* [TEXT] Section Name */}
                <p className="text-sm sm:text-md lg:text-lg font-roboto font-semibold text-[var(--color-text-800)] truncate">
                  {section.name}
                </p>

                {/* [TEXT] Grade Level + Curriculum + School Year */}
                <p className="text-xs md:text-sm font-roboto text-[var(--color-text-700)]">
                  Grade {section.gradeLevel} · {section.curriculum} · {section.schoolYear}
                </p>

                {/* [TEXT] # of students */}
                <p className="text-xs md:text-sm font-roboto text-[var(--color-text-500)]">
                  {section.classSize === 0
                    ? "No students"
                    : `${section.classSize} student${section.classSize === 1 ? "" : "s"}`}
                </p>
              </div>

              {/* [COMPONENT] Advisory Badge */}
              <AdvisoryBadge />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedSectionsCard;