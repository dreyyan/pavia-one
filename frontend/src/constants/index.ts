// ? [CONSTANTS] Options
export const GRADE_LEVEL_OPTIONS = ["7", "8", "9", "10"];

export const CURRICULUM_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "Regular",  label: "Regular",  description: "Standard K to 12 curriculum" },
  { value: "STE",      label: "STE",      description: "Science, Technology & Engineering" },
  { value: "SPS",      label: "SPS",      description: "Specialization – Sports (Badminton)" },
  { value: "SPA",      label: "SPA",      description: "Specialization – Visual Arts" },
  { value: "SPJ",      label: "SPJ",      description: "Specialization – ICT / Journalism" },
];

export const SEX_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];

export const LEARNING_MODALITY_OPTIONS = [
  { value: "Face to Face", label: "Face to Face" },
  { value: "Distance Learning", label: "Distance Learning" },
  { value: "Blended", label: "Blended" },
  { value: "Online", label: "Online" },
  { value: "Homeschool", label: "Homeschool" },
  { value: "Other", label: "Other" }
];

export const WEIGHT_PRESETS: { label: string; ww: number; pt: number; qa: number }[] = [
  { label: "30 / 50 / 20", ww: 0.3, pt: 0.5, qa: 0.2 },  // Core / Humanities
  { label: "40 / 40 / 20", ww: 0.4, pt: 0.4, qa: 0.2 },  // Science / Math
  { label: "20 / 60 / 20", ww: 0.2, pt: 0.6, qa: 0.2 },  // MAPEH / EPP / TLE
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