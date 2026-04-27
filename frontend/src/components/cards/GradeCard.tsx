// [IMPORT] Libraries
import React from "react";

// ? [INTERFACE] Grade shape
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

// [COMPONENT]
const GradeCard: React.FC<GradeCardProps> = ({ grade, onClick }) => {
  const isPassing = grade.finalRating !== null && grade.finalRating >= 75;
  const hasPassed = grade.remarks?.toLowerCase() === "passed";
  const hasFailed = grade.remarks?.toLowerCase() === "failed";

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onClick?.(grade.id)}
    >
      {/* [HEADER] Subject name */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 border-b border-[var(--color-bg-200)]">
        <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
          {grade.subject}
        </p>
      </div>

      {/* [DETAILS] Quarterly grades, final rating, remarks */}
      <div className="px-4 py-3 space-y-3 text-sm">

        {/* [GRID] Quarter Grades */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {([
            { label: "Q1", value: grade.q1 },
            { label: "Q2", value: grade.q2 },
            { label: "Q3", value: grade.q3 },
            { label: "Q4", value: grade.q4 },
          ] as const).map(q => (
            <div key={q.label}>
              <p className="text-[var(--color-text-500)] text-xs mb-0.5">{q.label}</p>
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
          <span
            className={`font-semibold ${
              grade.finalRating === null
                ? "text-[var(--color-text-500)]"
                : isPassing
                ? "text-[var(--color-accent-700)]"
                : "text-[var(--color-red-600)]"
            }`}
          >
            {grade.finalRating ?? "—"}
          </span>
        </div>

        {/* [FIELD] Remarks */}
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Remarks
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
              hasPassed
                ? "bg-[var(--color-accent-100)] text-[var(--color-accent-700)]"
                : hasFailed
                ? "bg-[var(--color-red-100)] text-[var(--color-red-600)]"
                : "bg-[var(--color-bg-100)] text-[var(--color-text-600)]"
            }`}
          >
            {grade.remarks ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GradeCard;