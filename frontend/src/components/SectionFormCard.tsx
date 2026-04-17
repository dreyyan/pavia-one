// [IMPORT] Constants, Types, Helpers
import { FORM_STATUS_BADGE, FORM_STATUS_LABELS } from "../constants/index";
import { SectionOverview } from "../types/index";
import { getMissingInfo, sectionFormSummary } from "../helpers/index";

// ? [INTERFACE]
interface SectionFormCardProps {
  section: SectionOverview;
  onClick: (sectionId: number) => void;
}

const SectionFormCard = ({ section, onClick }: SectionFormCardProps) => {
  // [DERIVED] Form status, individual forms, and missing info
  const summary = sectionFormSummary(section.schoolForms);
  const sf1     = section.schoolForms.find((f) => f.type === "SF1");
  const sf5     = section.schoolForms.find((f) => f.type === "SF5");
  const missing = getMissingInfo(section);

  return (
    <div
      onClick={() => onClick(section.id)}
      className={`bg-white rounded-md border overflow-hidden hover:translate-y-[-1px] hover:shadow-md active:shadow-md transition-all duration-200 cursor-pointer ${
        missing.length > 0 ? "border-amber-200" : "border-[var(--color-bg-200)]"
      }`}
    >
      {/* [BANNER] Missing info warning */}
      {missing.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center gap-1.5">
          <img src="/error-icon.svg" className="size-6" />
          <p className="text-xs text-amber-700 font-medium">{missing.join(" · ")}</p>
        </div>
      )}

      {/* [CARD] Header */}
      <div className="bg-[var(--color-bg-50)] px-3 pr-4 py-3 flex items-center justify-between border-b border-[var(--color-bg-200)]">
        <div className="flex items-center w-full gap-3 min-w-0">
          {/* [UI] Grade level avatar */}
          <div className="size-10 rounded-md bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border border-[var(--color-primary-200)] flex-shrink-0">
            G{section.gradeLevel}
          </div>

          {/* [UI] Section name + school year */}
          <div className="flex-1 min-w-0">
            <p className="font-roboto font-bold text-[var(--color-text-900)] text-base leading-tight truncate">{section.name}</p>
            <p className="text-xs text-[var(--color-text-500)] mt-0.5">{section.schoolYear}</p>
          </div>
        </div>

        {/* [BADGE] Overall form status */}
        <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[summary]}`}>
          {FORM_STATUS_LABELS[summary]}
        </span>
      </div>

      {/* [CARD] Body */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">Adviser</span>
          <span className="text-[var(--color-text-900)]">{section?.adviser?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">Curriculum</span>
          <span className="text-[var(--color-text-900)]">{section.curriculum}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-text-700)] font-semibold">Enrolled</span>
          <span className={`font-semibold ${section.enrollments.length === 0 ? "text-amber-600" : "text-[var(--color-text-900)]"}`}>
            {section.enrollments.length} students
          </span>
        </div>

        {/* [BADGES] Individual form statuses */}
        <div className="flex gap-2 pt-1 flex-wrap">
          {sf1
            ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[sf1.status]}`}>SF1: {FORM_STATUS_LABELS[sf1.status]}</span>
            : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">SF1: Missing</span>}
          {sf5
            ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FORM_STATUS_BADGE[sf5.status]}`}>SF5: {FORM_STATUS_LABELS[sf5.status]}</span>
            : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">SF5: Missing</span>}
        </div>
      </div>
    </div>
  );
};

export default SectionFormCard;