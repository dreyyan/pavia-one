// [IMPORT] Libraries
import React from "react";

// [IMPORT] Types
interface GradeCardProps {
  grade: {
    id: number;
    subject: string;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    finalRating: number | null;
    remarks: string | null;
  };
  onClick?: (id: number) => void;
}

// [COMPONENT] GradeCard
const GradeCard: React.FC<GradeCardProps> = ({ grade, onClick }) => {
  const handleClick = () => {
    if (onClick) onClick(grade.id);
  };

  return (
    <div
      className="w-full min-w-0 bg-[var(--color-bg-100)] rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* [HEADER] Subject */}
      <div className="px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg truncate">
          {grade.subject}
        </p>
      </div>

      {/* [DETAILS] Grades */}
      <div className="px-4 py-3 space-y-3 text-sm bg-[var(--color-bg-50)]">

        {/* [GRID] Quarter Grades */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Q1", value: grade.q1 },
            { label: "Q2", value: grade.q2 },
            { label: "Q3", value: grade.q3 },
            { label: "Q4", value: grade.q4 },
          ].map((q) => (
            <div key={q.label}>
              <p className="text-[var(--color-text-500)] text-xs">{q.label}</p>
              <p className="font-semibold text-[var(--color-text-900)]">
                {q.value ?? "—"}
              </p>
            </div>
          ))}
        </div>

        {/* [FIELD] Final Rating */}
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Final Rating
          </span>
          <span className="text-[var(--color-text-900)] font-semibold">
            {grade.finalRating ?? "—"}
          </span>
        </div>

        {/* [FIELD] Remarks */}
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Remarks
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right max-w-[160px]">
            {grade.remarks ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GradeCard;