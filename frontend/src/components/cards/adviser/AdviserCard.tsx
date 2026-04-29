// [IMPORT] Hooks
import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Sub-components
import Badge from "../../badges/Badge";
import Avatar from "../../badges/Avatar";

// [IMPORT] Helpers & Types
import { formatName } from "../../../helpers";
import type { Adviser } from "../../../types";

interface AdviserCardProps {
  adviser: Adviser;
  onClick?: (adviserId: number) => void;
}

const AdviserCard: React.FC<AdviserCardProps> = ({ adviser: a, onClick }) => {
  const navigate = useNavigate();

  // [DERIVED] Section
  const sections = a.sections ?? [];
  const firstSection = sections[0];
  const hasSection = sections.length > 0;

  // [DERIVED] Avatar color
  const avatarColor =
    a.sex === "FEMALE"
      ? "red"
      : a.sex === "MALE"
      ? "blue"
      : "neutral";

  const initials = a.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // [HANDLE] Navigate to adviser details
  const handleClick = () => {
    if (onClick) onClick(a.id);
    else navigate(`/admin/advisers/view/${a.id}`);
  };

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* [HEADER] Avatar, Name & ID */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">

          {/* [UI] Avatar */}
          <Avatar
            label={initials}
            color={avatarColor ?? "neutral"}
          />

          {/* [TEXT] Name + Adviser ID */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {formatName(a.name)}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              #{a.adviserId}
            </p>
          </div>
        </div>
      </div>

      {/* [DETAILS] Fields */}
      <div className="px-4 py-3 space-y-2 text-sm">

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Email
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
            {a.email}
          </span>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Assigned Section
          </span>

          <div className="flex justify-end min-w-0">
            {hasSection && firstSection ? (
              <span className="truncate text-[var(--color-text-900)]">
                Grade {firstSection.gradeLevel} — {firstSection.name}
              </span>
            ) : (
              <Badge label="Unassigned" color="red" />
            )}
          </div>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Sections
          </span>
          <span className="text-[var(--color-text-900)] font-semibold">
            {a.sectionCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdviserCard;