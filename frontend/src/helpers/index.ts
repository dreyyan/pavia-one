import { SPECIAL_SECTIONS } from "../constants/index";
import { SectionOverview, SectionForm, SchoolFormStatus } from "../types/index";

// [HELPER] Safe JSON parse
export const safeJson = async (res: Response) => {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { success: false, message: `Server error (${res.status})` }; }
};

// [HELPER] Section overall status = worst-status of its forms
export const sectionFormSummary = (forms: SectionForm[]): SchoolFormStatus => {
  if (!forms.length) return "DRAFT";
  const priority: SchoolFormStatus[] = ["DRAFT", "GENERATED", "SUBMITTED", "APPROVED", "LOCKED"];
  return forms.reduce<SchoolFormStatus>((worst, f) =>
    priority.indexOf(f.status) < priority.indexOf(worst) ? f.status : worst
  , "LOCKED");
};

// [HELPER] Detect missing info for a section's forms
export const getMissingInfo = (section: SectionOverview): string[] => {
  const missing: string[] = [];
  const sf1 = section.schoolForms.find((f) => f.type === "SF1");
  const sf5 = section.schoolForms.find((f) => f.type === "SF5");
  if (!sf1) missing.push("SF1 not generated");
  else if (sf1.status === "DRAFT") missing.push("SF1 still in draft");
  if (!sf5) missing.push("SF5 not generated");
  else if (sf5.status === "DRAFT") missing.push("SF5 still in draft");
  if (section.enrollments.length === 0) missing.push("No enrolled students");
  return missing;
};

// [HELPER] Darken a hex color by a percentage
export function darkenColor(hex: string, percent: number) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) * (1 - percent)));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) * (1 - percent)));
    const b = Math.max(0, Math.min(255, (num & 0xff) * (1 - percent)));
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// [HELPER] Normalize sex value
export const normalizeSex = (sex: unknown): string => {
  if (!sex) return "";

  const s = String(sex).trim().toLowerCase();

  if (s === "male" || s === "m") return "Male";
  if (s === "female" || s === "f") return "Female";

  return "";
};

// [HELPER] Get grade level color scheme
export const getGradeColor = (grade: number) => {
  switch (grade) {
    case 7:
      return {
        bg: "bg-[var(--color-accent-50)]",
        text: "text-[var(--color-accent-700)]",
        badge: "text-[var(--color-accent-700)] bg-[var(--color-accent-100)] border-[var(--color-accent-300)]"
      };
    case 8:
      return {
        bg: "bg-[var(--color-secondary-50)]",
        text: "text-[var(--color-secondary-700)]",
        badge: "text-[var(--color-secondary-600)] bg-[var(--color-secondary-100)] border-[var(--color-secondary-300)]"
      };
    case 9:
      return {
        bg: "bg-[var(--color-primary-50)]",
        text: "text-[var(--color-primary-700)]",
        badge: "text-[var(--color-primary-700)] bg-[var(--color-primary-100)] border-[var(--color-primary-300)]"
      };
    case 10:
      return {
        bg: "bg-[var(--color-red-50)]",
        text: "text-[var(--color-red-700)]",
        badge: "text-[var(--color-red-700)] bg-[var(--color-red-100)] border-[var(--color-red-300)]"
      };
    default:
      return {
        bg: "bg-[var(--color-bg-50)]",
        text: "text-[var(--color-text-700)]",
        badge: "text-[var(--color-text-700)] bg-[var(--color-bg-100)] border-[var(--color-bg-300)]"
      };
  }
};

// [HELPER] Get visible pagination pages
export const getVisiblePages = (current: number, total: number) => {
  const delta = 1; // how many pages around current

  const range: (number | "...")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);

  if (left > 2) range.push("...");

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < total - 1) range.push("...");

  if (total > 1) range.push(total);

  return range;
};

// [HELPER] Format a date string for display (e.g. "April 2, 2026")
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// [HELPER] Format a date string for datetime-local input value
export const formatDateInput = (dateStr?: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 16);
};

// [HELPER] Convert datetime-local string (e.g. "2026-04-02T10:00") to full
// ISO 8601 that Prisma/PostgreSQL accepts. Returns null for empty/invalid values.
export const toISOStringOrNull = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// [HELPER] Extract abbreviated month and zero-padded day from a SchoolEvent's startDate
export const getEventDateDisplay = (event: { startDate: string }): { month: string; day: string } => {
  const start = new Date(event.startDate);
  return {
    month: start.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(start.getDate()).padStart(2, "0"),
  };
};

// [HELPER] Format full name as "LASTNAME, First M." (e.g. "DOE, John A.")
export const formatName = (fullName: string) => {
  const parts = fullName.trim().split(" ");

  if (parts.length === 0) return fullName;

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleNames = parts.slice(1, -1);

  const middleInitial = middleNames.length > 0
    ? middleNames[0][0].toUpperCase() + "."
    : "";

  return `${lastName.toUpperCase()}, ${firstName} ${middleInitial}`.trim();
};

// [HELPER] Get last name in lowercase for sorting purposes
export const getLastName = (fullName: string) => {
  const parts = fullName.trim().split(" ").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1].toLowerCase() : "";
};

// [HELPER] Get curriculum of a section based on its grade and name
export const getSectionCurriculum = (
  grade: string,
  sectionName: string
): string => {
  const map = SPECIAL_SECTIONS[grade];
  if (!map) return "Regular";

  for (const [curriculum, sections] of Object.entries(map)) {
    if (sections.includes(sectionName)) return curriculum;
  }

  return "Regular";
};

// [HELPER] Normalize school year string by replacing various dash types with a standard hyphen
export const normalizeSchoolYear = (year: string) => {
  return year.replace(/\s*[-–—]\s*/, "-");
};

// [HELPER] Format breadcrumb name in the format "LAST_NAME, F. M."
export const formatBreadcrumbName = (name: string): string => {
  const parts = name.trim().split(" ");

  // If it's not at least 2–3 parts, don't touch it
  if (parts.length < 2) return name;

  const lastName = parts[parts.length - 1].toUpperCase();
  const initials = parts
    .slice(0, -1)
    .map((p) => p.charAt(0).toUpperCase() + ".")
    .join(" ");

  return `${lastName}, ${initials}`;
};