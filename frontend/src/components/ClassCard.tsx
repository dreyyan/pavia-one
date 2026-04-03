import React from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

interface ClassCardProps {
  id: number;
  name: string;
  schedule?: { day: string; time: string }[];
  classSize: number;
  maleCount?: number;
  femaleCount?: number;
  color: string;
  sf1_status?: string;
  sf2_status?: string;
  sf5_status?: string;
  gradeLevel?: number | string;
  curriculum?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  name,
  classSize,
  color,
  sf1_status,
  sf2_status,
  sf5_status,
  gradeLevel = "—",
  curriculum = "",
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const hasSchoolForms = sf1_status || sf2_status || sf5_status;
    const path = hasSchoolForms
      ? `/adviser/school-forms/${id}`
      : `/adviser/classes/${id}`;
    navigate(path);
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === "complete") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s === "pending") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-50 text-slate-500 border-slate-100";
  };

  const sfStatuses = [
    { key: "SF1", value: sf1_status },
    { key: "SF2", value: sf2_status },
    { key: "SF5", value: sf5_status },
  ].filter((s) => s.value);

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-lg border border-[var(--color-bg-200)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200"
    >
      {/* Top colored bar */}
      <div
        className="px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center w-full gap-3 min-w-0">
          <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-xl border border-[var(--color-primary-200)] flex-shrink-0">
            {gradeLevel}
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
      </div>

      {/* Body Info */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Class Size
          </span>
          <span className="text-[var(--color-text-900)] flex items-center gap-1">
            <Users className="size-3.5" />
            {classSize} Students
          </span>
        </div>

        {/* Optional SF Status Badges */}
        {sfStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {sfStatuses.map(({ key, value }) => (
              <span
                key={key}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusBadge(
                  value
                )}`}
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCard;