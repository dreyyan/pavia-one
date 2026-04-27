// [IMPORT] Libraries
import React from "react";

// ? [INTERFACE] Student grade row
interface StudentGrade {
  id: number;
  lrn: string;
  fullName: string;
  average: number | null;
  remarks: string | null;
}

interface StudentGradeCardProps {
  student: StudentGrade;
  onClick?: () => void;
}

const StudentGradeCard: React.FC<StudentGradeCardProps> = ({ student: s, onClick }) => {
  const initials = s.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isPassing = s.average !== null && s.average >= 75;
  const hasPassed = s.remarks?.toLowerCase() === "passed";
  const hasFailed = s.remarks?.toLowerCase() === "failed";

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* [HEADER] Avatar, Name & LRN */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Initials Avatar */}
          <div className="size-10 rounded-md bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-200)] flex items-center justify-center font-bold px-4 text-xl flex-shrink-0">
            {initials}
          </div>

          {/* [TEXT] Name + LRN */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {s.fullName}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              LRN{" "}
              <span className="font-semibold text-[var(--color-text-700)]">
                {s.lrn}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* [DETAILS] Average & Remarks */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Average
          </span>
          <span
            className={`font-semibold truncate text-right min-w-0 ${
              s.average === null
                ? "text-[var(--color-text-500)]"
                : isPassing
                ? "text-[var(--color-accent-700)]"
                : "text-[var(--color-red-600)]"
            }`}
          >
            {s.average ?? "—"}
          </span>
        </div>

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
            {s.remarks ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentGradeCard;