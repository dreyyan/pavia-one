import { SchoolFormType, SchoolFormStatus, EventType, EventFormData, AnnouncementFormData, BadgeColor } from "../types";

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
export type GradeLevel = typeof GRADE_LEVEL_OPTIONS[number];
export type SpecialCurriculum = "STE" | "SPJ" | "SPS" | "SPA";
export type SpecialSections = Record<
  GradeLevel,
  Partial<Record<SpecialCurriculum, string[]>>
>;
export type SectionMasterlist = Record<GradeLevel, string[]>;

export const LEARNING_MODALITY_OPTIONS = [
  { value: "FACE_TO_FACE", label: "Face to Face" },
  { value: "DISTANCE_LEARNING", label: "Distance Learning" },
  { value: "BLENDED", label: "Blended" },
  { value: "ONLINE", label: "Online" },
  { value: "HOMESCHOOL", label: "Homeschool" },
  { value: "OTHER", label: "Other" },
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

export const STATUS_BADGE: Record<SchoolFormStatus, string> = {
  DRAFT:     "bg-gray-100 text-gray-500 border border-gray-200",
  GENERATED: "bg-blue-100 text-blue-700 border border-blue-200",
  SUBMITTED: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  APPROVED:  "bg-green-100 text-green-700 border border-green-200",
  LOCKED:    "bg-purple-100 text-purple-700 border border-purple-200",
};

export const STATUS_LABEL: Record<SchoolFormStatus, string> = {
  DRAFT:     "Draft",
  GENERATED: "Generated",
  SUBMITTED: "Submitted",
  APPROVED:  "Approved",
  LOCKED:    "Locked",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SCHOOL_EVENT: "School Event",
  ACADEMIC_EVENT: "Academic Event",
  COMMUNITY_SERVICE: "Community Service",
  OTHER: "Other",
};

export const EVENT_TYPE_OPTIONS: EventType[] = [
  "SCHOOL_EVENT",
  "ACADEMIC_EVENT",
  "COMMUNITY_SERVICE",
  "OTHER",
];

export const ANNOUNCEMENT_INITIAL: AnnouncementFormData = {
  title: "",
  content: "",
  publishedAt: "",
  expiresAt: "",
};

export const EVENT_INITIAL: EventFormData = {
  title: "",
  description: "",
  location: "",
  type: "OTHER",
  startDate: "",
  endDate: "",
  isOnline: false,
};

export const SECTION_MASTERLIST: SectionMasterlist = {
  7: [
    "Archernar",
    "Adhara",
    "Alkaid",
    "Altair",
    "Arcturus",
    "Ascella",
    "Capella",
    "Deneb",
    "Draco",
    "Lyra",
    "Mira",
    "Orion",
    "Perseus",
    "Phoenix",
    "Polaris",
    "Regulus",
    "Rigel",
    "Saiph",
    "Sirius",
    "Spica",
    "Vega",
    "Zania",
  ],
  8: [
    "Anthurium",
    "Asphodel",
    "Aster",
    "Begonia",
    "Bluebell",
    "Camellia",
    "Carnation",
    "Daffodil",
    "Edelweiss",
    "Hyacinth",
    "Iris",
    "Ixora",
    "Jasmine",
    "Lavender",
    "Lily",
    "Mallow",
    "Peony",
    "Rose",
    "Sampaguita",
    "Stargazer",
    "Trillium",
    "Zinnia",
  ],
  9: [
    "Benevolence",
    "Charity",
    "Chastity",
    "Compassion",
    "Courage",
    "Creativity",
    "Faith",
    "Fortitude",
    "Friendship",
    "Harmony",
    "Honesty",
    "Humility",
    "Integrity",
    "Justice",
    "Love",
    "Loyalty",
    "Obedience",
    "Patience",
    "Peace",
    "Prudence",
    "Sincerity",
  ],
  10: [
    "Alexandrite",
    "Amber",
    "Amethyst",
    "Aquamarine",
    "Beryl",
    "Carnelian",
    "Citrine",
    "Diamond",
    "Emerald",
    "Garnet",
    "Jade",
    "Olivine",
    "Onyx",
    "Opal",
    "Peridot",
    "Ruby",
    "Sapphire",
    "Sardonyx",
    "Sphene",
    "Spinel",
    "Topaz",
    "Zircon",
  ],
};

export const SPECIAL_SECTIONS: SpecialSections = {
  7: {
    STE: ["Orion", "Lyra"],
    SPJ: ["Polaris"],
    SPS: ["Perseus"],
    SPA: ["Draco"],
  },
  8: {
    STE: ["Camellia", "Aster"],
    SPJ: ["Peony"],
    SPS: ["Trillium"],
    SPA: ["Mallow"],
  },
  9: {
    STE: ["Humility", "Fortitude"],
    SPJ: ["Creativity"],
    SPS: ["Courage"],
    SPA: ["Prudence"],
  },
  10: {
    STE: ["Emerald", "Onyx"],
    SPJ: ["Citrine"],
    SPS: ["Sphene"],
    SPA: ["Amber"],
  },
};

export const SECTION_FORMS = ["SF1", "SF2", "SF5"] as const;
export const STUDENT_FORMS = ["SF9", "SF10"];
export const FORM_TITLES: Record<string, string> = {
  SF1: "School Register",
  SF2: "Daily Attendance Report",
  SF5: "Report on Promotion and Learning Progress",
  SF9: "Report Card",
  SF10: "Permanent Record",
};

export const FORM_THEME: Record<
  string,
  { bg: string; border: string; text: string; icon: string }
> = {
  SF1: {
    bg: "bg-[var(--color-blue-50)]",
    border: "border-[var(--color-blue-200)]",
    text: "text-[var(--color-blue-700)]",
    icon: "text-[var(--color-blue-600)]",
  },
  SF2: {
    bg: "bg-[var(--color-orange-50)]",
    border: "border-[var(--color-orange-200)]",
    text: "text-[var(--color-orange-700)]",
    icon: "text-[var(--color-orange-600)]",
  },
  SF5: {
    bg: "bg-[var(--color-green-50)]",
    border: "border-[var(--color-green-200)]",
    text: "text-[var(--color-green-700)]",
    icon: "text-[var(--color-green-600)]",
  },
  SF9: {
    bg: "bg-[var(--color-purple-50)]",
    border: "border-[var(--color-purple-200)]",
    text: "text-[var(--color-purple-700)]",
    icon: "text-[var(--color-purple-600)]",
  },
  SF10: {
    bg: "bg-[var(--color-bg-50)]",
    border: "border-[var(--color-text-200)]",
    text: "text-[var(--color-text-700)]",
    icon: "text-[var(--color-text-600)]",
  }
};

export const FORM_PERMISSIONS = {
  SF1: { import: true, export: true },
  SF2: { import: false, export: true },
  SF5: { import: false, export: true },
  SF9: { import: false, export: true },
  SF10:{ import: false, export: true },
};

export const BORDER_COLORS = {
  default: "border-t-[var(--color-primary-500)]",
  error: "border-t-[var(--color-red-600)]",
  success: "border-t-[var(--color-accent-500)]",
  info: "border-t-[var(--color-primary-700)]",
  warning: "border-t-[var(--color-secondary-600)]",
};

export const TEXT_COLORS = {
  default: "text-[var(--color-primary-500)]",
  error: "text-[var(--color-red-600)]",
  success: "text-[var(--color-accent-600)]",
  info: "text-[var(--color-primary-700)]",
  warning: "text-[var(--color-secondary-500)]",
};
  
export const CONFIRM_BUTTON_COLORS = {
  default: "bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]",
  error: "bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)]",
  success: "bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)]",
  info: "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)]",
  warning: "bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)]",
};

export const CURRICULUM_BADGE_MAP: Record<string, BadgeColor> = {
  Regular: "secondary",
  SPJ: "blue",
  SPS: "orange",
  STE: "violet",
  SPA: "pink",
};