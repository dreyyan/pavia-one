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
export const normalizeSex = (sex: any): string => {
  if (!sex) return "";

  const s = String(sex).trim().toLowerCase();

  if (s === "male" || s === "m") return "Male";
  if (s === "female" || s === "f") return "Female";

  return "";
};