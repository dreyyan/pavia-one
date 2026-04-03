import { SchoolFormType, SchoolFormStatus } from "../types";

// ? [CONSTANTS] Options
export const GRADE_LEVEL_OPTIONS = ["7", "8", "9", "10"];

export const SEX_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];

export const CURRICULUM_OPTIONS = [
  { value: "Regular", label: "Regular", description: "Standard K to 12 curriculum" },
  { value: "STE", label: "STE", description: "Science, Technology & Engineering" },
  { value: "SPS", label: "SPS", description: "Specialization – Sports (Badminton)" },
  { value: "SPA", label: "SPA", description: "Specialization – Visual Arts" },
  { value: "SPJ", label: "SPJ", description: "Specialization – ICT / Journalism" },
] as const;

export type Curriculum = typeof CURRICULUM_OPTIONS[number]["value"];

export const LEARNING_MODALITY_OPTIONS = [
  { value: "Face to Face", label: "Face to Face" },
  { value: "Distance Learning", label: "Distance Learning" },
  { value: "Blended", label: "Blended" },
  { value: "Online", label: "Online" },
  { value: "Homeschool", label: "Homeschool" },
  { value: "Other", label: "Other" }
];

export const WEIGHT_PRESETS: { label: string; ww: number; pt: number; qa: number }[] = [
  { label: "30 / 50 / 20", ww: 0.3, pt: 0.5, qa: 0.2 }, // Core (e.g. Humanities)
  { label: "40 / 40 / 20", ww: 0.4, pt: 0.4, qa: 0.2 }, // (e.g. Science, Mathematics)
  { label: "20 / 60 / 20", ww: 0.2, pt: 0.6, qa: 0.2 }, // (e.g. MAPEH, EPP, TLE)
];

// ? [CONSTANTS] Labels
export const SUBJECT_PAGE_LABELS: [string, string] = [
  "Subject Info",
  "Grading Weights",
];

export const STUDENT_DETAILS_PAGE_LABELS: [string, string, string] = [
  "Basic Information",
  "Address",
  "Parents",
];

// ? [CONSTANTS] Form
export const FORM_STATUS_LABELS: Record<SchoolFormStatus, string> = {
  DRAFT:     "Draft",
  GENERATED: "Generated",
  SUBMITTED: "Submitted",
  APPROVED:  "Approved",
  LOCKED:    "Locked",
};

export const FORM_STATUS_BADGE: Record<SchoolFormStatus, string> = {
  DRAFT:     "bg-[var(--color-bg-300)] text-[var(--color-text-500)] border border-[var(--color-bg-400)]",
  GENERATED: "bg-blue-100 text-blue-700 border border-blue-200",
  SUBMITTED: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  APPROVED:  "bg-green-100 text-green-700 border border-green-200",
  LOCKED:    "bg-purple-100 text-purple-700 border border-purple-200",
};

export const FORM_TYPES: Record<
  SchoolFormType,
  { label: string; description: string }
> = {
  SF1: {
    label: "SF1 — Class Register",
    description:
      "The master list of all enrolled students in the section for the school year.",
  },
  SF5: {
    label: "SF5 — Report on Promotion",
    description:
      "Records the action taken (promoted, conditional, retained) for each student at year-end.",
  },
};