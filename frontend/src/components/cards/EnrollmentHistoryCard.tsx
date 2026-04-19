import React from "react";
import { StatusBadge } from "../StatusBadge";

interface Enrollment {
  id: number;
  sectionId: number;
  schoolYear: string;
  learningModality: string;
  status: string;
  section?: {
    name: string;
    gradeLevel: string;
    curriculum: string;
  } | null;
}

interface EnrollmentHistoryCardProps {
  enrollments: Enrollment[];
}

const EnrollmentHistoryCard: React.FC<EnrollmentHistoryCardProps> = ({ enrollments }) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4 space-y-1">
      <p className="form-section-title">
        Enrollment History
      </p>

      {enrollments.length === 0 ? (
        <p className="text-sm font-roboto text-[var(--color-text-600)]">
          No enrollment records.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {enrollments.map(enrollment => (
            <div
              key={enrollment.id}
              className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-roboto font-semibold text-[var(--color-text-900)] truncate">
                  {enrollment.section?.name ?? `Section #${enrollment.sectionId}`}
                </p>

                <p className="text-xs font-roboto text-[var(--color-text-600)]">
                  {enrollment.section
                    ? `Grade ${enrollment.section.gradeLevel} · ${enrollment.section.curriculum}`
                    : "—"}
                  {" · "}
                  {enrollment.schoolYear}
                </p>

                <p className="text-xs font-roboto text-[var(--color-text-500)]">
                  {enrollment.learningModality}
                </p>
              </div>

              <StatusBadge status={enrollment.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrollmentHistoryCard;