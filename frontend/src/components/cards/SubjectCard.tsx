// [IMPORT] Libraries
import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers
import { getGradeColor } from "../../helpers";

// [IMPORT] Types
import type { Subject } from "../../types";

interface SubjectCardProps {
  subject: Subject;
  onClick?: (id: number) => void;
}

// [COMPONENT]
const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => {
  const navigate = useNavigate();
  const colors = getGradeColor(subject.gradeLevel);

  const handleClick = () => {
    if (onClick) onClick(subject.id);
    else navigate(`/admin/subjects/view/${subject.id}`);
  };

  return (
    <div
      className="w-full min-w-0 bg-white rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* [HEADER] Grade Badge, Name & Code */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Grade Level Badge */}
          <div
            className={`size-10 rounded-md flex items-center justify-center font-bold text-sm border flex-shrink-0 px-1 ${colors.badge}`}
          >
            {subject.gradeLevel}
          </div>

          {/* [TEXT] Name + Subject Code */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {subject.name}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {subject.code}
            </p>
          </div>
        </div>
      </div>

      {/* [DETAILS] Curriculum */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Curriculum
          </span>
          <span className="text-[var(--color-text-900)] truncate text-right min-w-0">
            {subject.curriculum ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;