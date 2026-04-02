import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, ChevronRight } from "lucide-react";

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
    <button
      onClick={handleClick}
      className="group relative flex flex-col w-full bg-white rounded-xl border border-slate-200 overflow-hidden hover:translate-y-[-4px] hover:shadow-xl active:translate-y-[-2px] transition-all duration-300 text-left"
    >
      {/* Top Accent Bar - Thicker for better visual anchoring */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Grade Level Badge */}
            <div className="size-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 font-black text-xl border border-slate-100 flex-shrink-0 group-hover:bg-white group-hover:border-[var(--color-primary-200)] transition-colors">
              {gradeLevel}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-blue-600 transition-colors">
                {name}
              </h2>
              
              {/* Secondary Metadata Row */}
              <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium text-[13px]">
                {curriculum && (
                  <>
                    <span className="uppercase tracking-wide">{curriculum}</span>
                    <span className="text-slate-300">•</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  <span>{classSize} Students</span>
                </div>
              </div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-300 mt-1 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>

        {/* School Forms Footer */}
        {sfStatuses.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
            {sfStatuses.map(({ key, value }) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${getStatusBadge(value)}`}
              >
                <span className="opacity-70">{key}</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                <span className="uppercase">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

export default ClassCard;