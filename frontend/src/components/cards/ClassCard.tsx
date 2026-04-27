// [IMPORT] Hooks
import React from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Helpers
import { getGradeColor } from "../../helpers";

interface ClassCardProps {
  id: number;
  name: string;
  classSize: number;
  maleCount?: number;
  femaleCount?: number;
  sf1_status?: string;
  sf2_status?: string;
  sf5_status?: string;
  gradeLevel?: number | string;
  curriculum?: string;
  displayFields?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  name,
  classSize,
  maleCount,
  femaleCount,
  sf1_status,
  sf2_status,
  sf5_status,
  gradeLevel = "—",
  curriculum = "",
  displayFields = true
}) => {
  const navigate = useNavigate();
  
  const grade = Number.parseInt(String(gradeLevel), 10);

  // [DERIVED] Avatar color
  const colors = !Number.isNaN(grade) ? getGradeColor(grade) : null;

  // [DERIVED] School Form Status Color
  const statusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === "complete") {
      return "bg-[var(--color-green-50)] text-[var(--color-green-700)] border-[var(--color-green-200)]";
    }
    if (s === "pending") {
      return "bg-[var(--color-orange-50)] text-[var(--color-orange-700)] border-[var(--color-orange-200)]";
    }
    return "bg-[var(--color-bg-50)] text-[var(--color-text-600)] border-[var(--color-bg-200)]";
  };

  // [DERIVED] School Forms Status'
  const sfStatuses = [
    { key: "SF1", value: sf1_status },
    { key: "SF2", value: sf2_status },
    { key: "SF5", value: sf5_status },
  ].filter((s) => s.value);

  // [HANDLE] Dynamic navigation (section details or school form details)
  const handleClick = () => {
    const hasSchoolForms = sf1_status || sf2_status || sf5_status;
    const path = hasSchoolForms
      ? `/adviser/school-forms/${id}`
      : `/adviser/classes/${id}`;
    navigate(path);
  };

  return (
    <div
      className="w-full min-w-0 bg-[var(--color-bg-100)] rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer shadow"
      onClick={handleClick}
    >
      {/* [SECTION] Header */}
      <div className="px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-text-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Grade Badge */}
          <div
            className={`size-10 rounded-md flex items-center justify-center font-bold text-xl border flex-shrink-0 ${
              colors?.badge ??
              "bg-[var(--color-bg-100)] text-[var(--color-text-700)] border-[var(--color-bg-300)]"
            }`}
          >
            {!Number.isNaN(grade) ? grade : "—"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {name}
            </p>

            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {curriculum}
            </p>
          </div>
        </div>

        {/* [UI] Student Count */}
        {classSize > 0 && (
          <div className="px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap flex items-center gap-1 flex-shrink-0 bg-[var(--color-bg-50)] text-[var(--color-text-700)] border border-[var(--color-bg-300)]">
            <img src="/person.svg" alt="students" className="size-3" />
            {classSize} student{classSize !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {displayFields && (
        // [SECTION] Student Demographics
        <div className="px-4 py-3 space-y-2 text-sm sm:text-base bg-[var(--color-bg-50)]">
          <div className="flex justify-between items-center min-w-0">
            <span className="text-[var(--color-text-700)] font-figree font-semibold">
              Male
            </span>
            <span className="text-[var(--color-text-900)]">
              {maleCount ?? 0}
            </span>
          </div>

          <div className="flex justify-between items-center min-w-0">
            <span className="text-[var(--color-text-700)] font-figree font-semibold">
              Female
            </span>
            <span className="text-[var(--color-text-900)]">
              {femaleCount ?? 0}
            </span>
          </div>

          {/* [UI] SF Status */}
          {sfStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {sfStatuses.map(({ key, value }) => (
                <span
                  key={key}
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${statusColor(
                    value
                  )}`}
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassCard;