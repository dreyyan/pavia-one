// [IMPORT] Hooks
import React from "react";

// [IMPORT] Sub-components
import { StatusBadge } from "../../badges/StatusBadge";

// [IMPORT] Types
import { Enrollment } from "../../../types";

interface EnrollmentHistoryCardProps {
  enrollments: Enrollment[];
}

const EnrollmentHistoryCard: React.FC<EnrollmentHistoryCardProps> = ({ enrollments }) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-1">
      <p className="form-section-title">
        Enrollment History <span className="form-section-value">({enrollments.length})</span>
      </p>

      {enrollments.length === 0 ? (
        <p className="text-sm font-roboto text-[var(--color-text-600)]">
          No enrollment records.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
          {enrollments.map(enrollment => (
            // [COMPONENT] Enrollment History Card
            <div
              key={enrollment.id}
              className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm sm:text-md lg:text-lg font-roboto font-semibold text-[var(--color-text-900)] truncate">
                  {enrollment.section?.name ?? `Section #${enrollment.sectionId}`}
                </p>

                <p className="text-xs md:text-sm font-roboto text-[var(--color-text-600)]">
                  {enrollment.section
                    ? `Grade ${enrollment.section.gradeLevel} · ${enrollment.section.curriculum}`
                    : "—"}
                  {" · "}
                  {enrollment.schoolYear}
                </p>

                <p className="text-xs md:text-sm font-roboto text-[var(--color-text-500)]">
                  {enrollment.learningModality}
                </p>
              </div>

              {/* [COMPONENT] Status Badge */}
              <StatusBadge status={enrollment.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrollmentHistoryCard;