// [IMPORT] Libraries
import React from "react";
import { useNavigate } from "react-router-dom";

interface Student {
  id: number;
  fullName: string;
  lrn: string;
  email?: string | null;
  sex?: "MALE" | "FEMALE" | string | null;
  adviser?: {
    name?: string | null;
  } | null;
}

interface StudentCardProps {
  student: Student;
}

const StudentCard: React.FC<StudentCardProps> = ({ student: s }) => {
  const navigate = useNavigate();

  const initials = s.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/admin/students/view/${s.id}`)}
    >
      {/* Header */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* Initials Avatar */}
          <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold px-4 text-xl border border-[var(--color-primary-200)] flex-shrink-0">
            {initials}
          </div>

          {/* Name + LRN */}
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

          {/* Sex Badge */}
          <div
            className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
              s.sex === "MALE"
                ? "bg-[var(--color-primary-100)] text-[var(--color-primary-500)]"
                : s.sex === "FEMALE"
                ? "bg-[var(--color-red-100)] text-[var(--color-red-500)]"
                : "bg-[var(--color-bg-100)] text-gray-600"
            }`}
          >
            {s.sex === "MALE" ? "M" : s.sex === "FEMALE" ? "F" : "—"}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Email
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right max-w-[210px]">
            {s.email ?? "—"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Adviser
          </span>
          <span className="text-[var(--color-text-900)] font-semibold truncate text-right max-w-[210px]">
            {s.adviser?.name ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;