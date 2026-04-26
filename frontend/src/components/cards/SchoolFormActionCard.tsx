// [IMPORT] Constants & Types
import { SchoolForm } from "../../types";
import { STATUS_BADGE, STATUS_LABEL, SECTION_FORMS, FORM_TITLES, FORM_THEME } from "../../constants";

const SchoolFormActionCard = ({
  form,
  sectionSchoolYear,
  onExport,
  onImport,
  exporting,
  importing,
  supportsImport,
}: {
  form: SchoolForm;
  sectionId: number;
  sectionSchoolYear: string;
  onExport: () => void;
  onImport?: () => void;
  exporting: boolean;
  importing: boolean;
  supportsImport: boolean;
}) => {
  const isSection = SECTION_FORMS.includes(form.type);
  const theme = FORM_THEME[form.type] || FORM_THEME.SF1;

  return (
    <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md overflow-hidden">
      {/* [HEADER] Form type + status badge */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[var(--color-bg-200)]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`size-10 rounded-md flex items-center justify-center border font-bold text-sm flex-shrink-0 ${theme.bg} ${theme.border} ${theme.text}`}
          >
            {form.type}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-roboto font-bold text-sm leading-tight ${theme.text}`}>
              {FORM_TITLES[form.type] || form.type}
            </p>
            <p className="text-xs font-mono text-[var(--color-text-600)] mt-0.5">
              {sectionSchoolYear}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[form.status]}`}>
          {STATUS_LABEL[form.status]}
        </span>
      </div>

      {/* [DETAILS] Timestamps + Actions */}
      <div className="px-4 py-3 space-y-3">
        {/* [TEXT] Timestamps */}
        <div className="space-y-1 text-xs font-roboto text-[var(--color-text-600)]">
          {form.generatedAt && (
            <p>Generated: {new Date(form.generatedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
          )}
          {form.submittedAt && (
            <p>Submitted: {new Date(form.submittedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
          )}
        </div>

        {/* [ACTIONS] Export + Import */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-roboto font-semibold px-3 py-1.5 rounded-md bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <img src="/export.svg" alt="Export" className="size-4" />
            {exporting ? "Exporting..." : `Export ${form.type}`}
          </button>

          {supportsImport && onImport && (
            <button
              onClick={onImport}
              disabled={importing}
              className="flex items-center gap-1.5 text-xs font-roboto font-medium px-3 py-1.5 rounded-md bg-[var(--color-bg-200)] hover:bg-[var(--color-bg-300)] text-[var(--color-text-800)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <img src="/import.svg" alt="Import" className="size-4" />
              {importing ? "Importing..." : `Import ${form.type}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolFormActionCard;