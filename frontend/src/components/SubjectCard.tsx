import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Types
import type { Subject } from "../types";

interface SubjectCardProps {
  subject: Subject;
  onClick?: (id: number) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick(subject.id);
    else navigate(`/admin/subjects/view/${subject.id}`);
  };

  return (
    <div
      className="bg-white rounded-md border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* HEADER */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border border-[var(--color-primary-200)] flex-shrink-0 px-1">
            {subject.gradeLevel}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-base leading-tight truncate">
              {subject.name}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {subject.code}
            </p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Curriculum
          </span>
          <span className="text-[var(--color-text-900)]">
            {subject.curriculum ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;