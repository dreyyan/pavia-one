// [IMPORT] React
import React from "react";

// [IMPORT] Sub-component
import Badge from "../../badges/Badge";
import Avatar from "../../badges/Avatar";

// [IMPORT] Helpers & Types
import { formatName } from "../../../helpers";
import { Student } from "../../../types";

interface StudentCardProps {
  student: Student;
  displayFields?: boolean;
  onClick?: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student: s,
  displayFields = true,
  onClick,
}) => {
  const enrollment = s.enrollments?.[0];
  const section = enrollment?.section;

  const gradeSection = section
    ? `Grade ${section.gradeLevel} - ${section.name}`
    : "—";

  const curriculum = section?.curriculum ?? "—";

  const initials = (s.fullName ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarColor =
    s.sex === "FEMALE"
      ? "red"
      : s.sex === "MALE"
      ? "blue"
      : "neutral";

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* Avatar */}
          <Avatar initials={initials} color={avatarColor} />

          {/* Name + LRN */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {formatName(s.fullName)}
            </p>

            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              LRN{" "}
              <span className="font-semibold text-[var(--color-text-700)]">
                {s.lrn}
              </span>
            </p>
          </div>

          {/* [COMPONENT] Sex badge */}
          <Badge
            label={s.sex === "MALE" ? "M" : s.sex === "FEMALE" ? "F" : "—"}
            variant={
              s.sex === "MALE"
                ? "info"
                : s.sex === "FEMALE"
                ? "danger"
                : "neutral"
            }
          />
        </div>
      </div>

      {/* Details section */}
      {displayFields && (
        <div className="px-4 py-3 space-y-2 text-sm">
          <div className="flex justify-between items-center min-w-0">
            <span className="text-[var(--color-text-700)] font-figree font-semibold">
              Grade & Section
            </span>
            <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
              {gradeSection}
            </span>
          </div>

          <div className="flex justify-between items-center min-w-0">
            <span className="text-[var(--color-text-700)] font-figree font-semibold">
              Adviser
            </span>
            <span className="text-[var(--color-text-900)] font-semibold truncate text-right min-w-0">
              {s.adviser?.name ?? "—"}
            </span>
          </div>

          <div className="flex justify-between items-center min-w-0">
            <span className="text-[var(--color-text-700)] font-figree font-semibold">
              Curriculum
            </span>
            <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
              {curriculum}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCard;