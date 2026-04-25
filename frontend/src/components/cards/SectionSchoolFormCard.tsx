import { STATUS_BADGE, STATUS_LABEL } from "../../constants";
import { getGradeColor } from "../../helpers";
import type { Section, SectionForm } from "../../types";

const FORM_TYPES = ["SF1", "SF2", "SF5", "SF9", "SF10"];

const FormBadge = ({
  type,
  form,
}: {
  type: string;
  form?: SectionForm;
}) => {
  if (!form) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--color-bg-100)] text-[var(--color-text-400)] border border-dashed border-[var(--color-bg-300)]">
        {type}: —
      </span>
    );
  }

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[form.status]}`}
    >
      {type}: {STATUS_LABEL[form.status]}
    </span>
  );
};

interface SectionSchoolFormCardProps {
  section: Section;
  onClick?: (sectionId: number) => void;
}

const SectionSchoolFormCard: React.FC<SectionSchoolFormCardProps> = ({
  section,
  onClick,
}) => {
  const colors = getGradeColor(Number(section.gradeLevel));

  const handleClick = () => {
    if (onClick) onClick(section.id);
  };

  return (
    <div
      className="w-full min-w-0 bg-[var(--color-bg-100)] rounded-md border border-[var(--color-bg-300)] overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* HEADER — EXACT SectionCard structure */}
      <div className="px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          
          <div
            className={`size-10 rounded-md flex items-center justify-center font-bold text-xl border flex-shrink-0 ${colors.badge}`}
          >
            {section.gradeLevel}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-lg leading-tight truncate">
              {section.name}
            </p>

            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5 tracking-wider truncate">
              {section.schoolYear}
            </p>
          </div>
        </div>

        <img
          src="/chevron-right.svg"
          alt=""
          className="size-4 flex-shrink-0 opacity-40"
        />
      </div>

      {/* BODY — same layout philosophy as SectionCard (rows, not chips) */}
      <div className="px-4 py-3 space-y-2 text-sm bg-[var(--color-bg-50)]">
        
        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Students
          </span>
          <span className="text-[var(--color-text-900)] font-semibold">
            {section.classSize}
          </span>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <span className="text-[var(--color-text-700)] font-figree font-semibold">
            Adviser
          </span>

          <span
            className={`truncate text-right max-w-[180px] min-w-0 ${
              !section.adviser
                ? "text-[var(--color-red-600)] italic"
                : "text-[var(--color-text-900)] font-semibold"
            }`}
          >
            {section.adviser?.name ?? "—"}
          </span>
        </div>

        <div className="flex justify-between items-center min-w-0">
          <div className="flex flex-wrap gap-1 justify-end">
            {FORM_TYPES.map((type) => {
              const form = section.schoolForms?.find(
                (f) => f.type === type
              );

              return (
                <FormBadge
                  key={type}
                  type={type}
                  form={form}
                />
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SectionSchoolFormCard;