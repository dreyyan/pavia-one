import type { Curriculum } from "../constants";

// ? [INTERFACE] Modal
export interface GeneralModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: "default" | "error" | "success" | "info" | "warning";
  confirmText: string;
  isCancelable: boolean;
  onConfirm: () => void;
}

// ? [INTERFACE] Form Data
export type LearningAreaFormData = {
  id?: number;
  name: string;
  gradeLevel: string;
  curriculum: string;
  writtenWorkWeight: string;
  performanceTaskWeight: string;
  quarterlyAssessmentWeight: string;
};

export type StudentFormData = {
  id?: number;
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  email: string;
  sex: string;
  birthDate: string;
  createdByAdviserId: string;
  adviserName: string;
  advisorySection: AdviserSection | null;
  learningModality: string;
};

export type SectionFormData = {
  id?: number;
  name: string;
  gradeLevel: string;
  schoolYear: string;
  curriculum: string;
  color: string;
  learningModality: string;
  room: string;

  adviserId?: string;
  adviserName?: string;
};

export type AdviserFormData = {
  id?: number;
  adviserId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
};

export interface SectionForm {
  id: number;
  sectionId: number;
  schoolYear: string;
  type: SchoolFormType;
  status: SchoolFormStatus;
  generatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  lockedAt?: string;
  generatedBy?: number;
  approvedBy?: number;
}

// ? [INTERFACE] Entities
export interface Section {
  id: number;
  name: string;
  gradeLevel: string | number;

  schoolYear?: string;
  curriculum?: string;
  learningModality?: string;

  classSize: number;
  room?: string;
  createdAt?: string;

  adviser?: {
    id: number;
    name: string;
    adviserId: string;
    email?: string;
  };

  color?: string;
  maleCount?: number;
  femaleCount?: number;

  schoolForms?: SectionForm[];
}

export interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  sections?: AdviserSection[];
  
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  email?: string;
  sectionCount?: number;
}

export interface Student {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  sex?: string;
  birthDate?: string;
  email?: string;
  createdByAdviserId: string;
  createdAt: string;

  adviser?: {
    id: number;
    name: string;
    adviserId: string;
  };

  enrollments: {
    id: number;
    sectionId: number;
    schoolYear: string;
    status: string;
    learningModality: string;
    enrollmentDate: Date;

    section?: {
      id: number;
      name: string;
      gradeLevel: number;
      curriculum: string;
    } | null;

    learningAreas?: {
      id: number;
      name: string;
    }[];
  }[];
}

export interface Enrollment {
  id: number;
  sectionId: number;
  schoolYear: string;
  status: string;
  learningModality: string;
  section?: {
    id: number;
    name: string;
    gradeLevel: string;
    curriculum: string;
  };
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  gradeLevel: number;
  hoursPerWeek?: number;
  description?: string;
  curriculum?: string;
  writtenWorkWeight?: number;
  performanceTaskWeight?: number;
  quarterlyAssessmentWeight?: number;
  createdAt: string;

  adviser?: {
    id: number;
    name: string;
  } | null;
}

// ? [TYPES] Specific Fields
export interface AdviserSection {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  classSize: number;
}

export interface SectionStudent {
  id: number;
  lrn: string;
  fullName: string;
  sex?: string;
  status: string;
  learningModality: string;
}

export interface SectionOverview {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: Curriculum;
  adviser: { id: number; adviserId: string; name: string; email: string };
  schoolForms: SectionForm[];
  enrollments: { id: number }[];
}

// ? [INTERFACE] Details
export interface StudentDetails {
  id: number;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  sex?: string;
  birthDate?: string;
  email?: string;
  createdByAdviserId: string;
  createdAt: string;
  adviser?: { id: number; name: string; adviserId: string };
  enrollments: Enrollment[];
  // Address
  houseStreet?: string;
  barangay?: string;
  municipalityCity?: string;
  province?: string;
  // Basic Info extras
  motherTongue?: string;
  ipEthnicGroup?: string;
  religion?: string;
  // Parents
  fatherLastName?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  motherLastName?: string;
  motherFirstName?: string;
  motherMiddleName?: string;
  guardianLastName?: string;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  contactNumber?: string;
}

export interface AdviserDetails {
  id: number;
  adviserId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  fullName: string;
  sex?: string;
  birthDate?: string;
  email?: string;
  contactNumber?: string;
  createdAt: string;
  sections: AdviserSection[];
}

export interface SectionDetails {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  learningModality: string;
  classSize: number;
  room?: string;
  createdAt: string;
  adviser?: { id: number; name: string; adviserId: string };
  students: SectionStudent[];
}

export interface LearningAreaDetails {
  id: number;
  name: string;
  gradeLevel: number;
  curriculum: string;
  writtenWorkWeight: number;
  performanceTaskWeight: number;
  quarterlyAssessmentWeight: number;
};

export interface SectionInfo {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum?: string;
  color: string;
  classSize: number;
  schoolForms: SectionForm[];

  maleCount?: number;
  femaleCount?: number;
}

export interface ImportResult {
  created: number;
  updated: number;
  enrolled: number;
  skippedEnrollment: number;
  errors: { lrn: string; reason: string }[];
}

// ? [TYPES] Form
export type SchoolFormType   = "SF1" | "SF5";
export type SchoolFormStatus = "DRAFT" | "GENERATED" | "SUBMITTED" | "APPROVED" | "LOCKED";
export type StudentFormStatus = "COMPLETE" | "PARTIAL" | "PENDING";
export type EventType = "SCHOOL_EVENT" | "ACADEMIC_EVENT" | "COMMUNITY_SERVICE" | "OTHER";

// ? [TYPES] Dashboard
export interface Profile {
  id: number;
  name: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdviserProfile {
  name: string;
  email?: string;
  sections: Section[];
  advisorySection?: Section | null;
  presentToday?: number;
  pendingTasks?: number;
}

export interface DashboardSummary {
  adminProfile: Profile;
  totalStudents: number;
  totalAdvisers: number;
  totalSections: number;
  totalAdmins: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  publishedAt?: string;
  expiresAt?: string;

  createdById?: number;
  createdBy?: { id: number; name: string };

  createdAt: string;
  updatedAt?: string;
}

export interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  location?: string;
  type: EventType;
  startDate: string;
  endDate?: string;

  isOnline?: boolean;
  createdById?: number;
  createdBy?: { id: number; name: string };

  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  publishedAt: string;
  expiresAt: string;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  type: EventType;
  startDate: string;
  endDate: string;
  isOnline: boolean;
}

export interface ScheduleItem {
  day: string;
  time: string;
}

export interface StudentGrade {
  id: number;
  lrn: string;
  fullName: string;
  average: number | null;
  remarks: string | null;
}

export type SectionUI = {
  id: number;
  name: string;
  gradeLevel: number;
  classSize: number;
  color: string;
  maleCount: number;
  femaleCount: number;
};

export type AdviserAnnouncement = Pick<
  Announcement,
  "id" | "title" | "content" | "publishedAt" | "expiresAt" | "createdAt"
>;

export type AdviserSchoolEvent = Pick<
  SchoolEvent,
  "id" | "title" | "description" | "type" | "startDate" | "endDate" | "createdAt"
>;

export interface SectionOverview {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;

  curriculum: Curriculum;

  adviser: {
    id: number;
    adviserId: string;
    name: string;
    email: string;
  };

  schoolForms: SectionForm[];
  enrollments: { id: number }[];
}

export interface SchoolForm {
  id: number;
  type: string;
  status: SchoolFormStatus;
  schoolYear: string;
  generatedAt?: string;
  submittedAt?: string;
}

export type FormType = "SF1" | "SF2" | "SF5" | "SF9" | "SF10";

export type SectionFormUI =
  | {
      id: number;
      type: FormType;
      status: SchoolFormStatus;
      schoolYear: string;
      generatedAt?: string;
      submittedAt?: string;
      isVirtual?: false;
    }
  | {
      id: string;
      type: FormType;
      status: "VIRTUAL";
      schoolYear: string;
      generatedAt?: undefined;
      submittedAt?: undefined;
      isVirtual: true;
    };

export type RealSchoolForm = {
  id: number;
  type: FormType;
  status: SchoolFormStatus;
  schoolYear: string;
  generatedAt?: string;
  submittedAt?: string;
};

export type VirtualSchoolForm = {
  id: string; // "virtual-SF2"
  type: FormType;
  status: "VIRTUAL";
  schoolYear: string;
  isVirtual: true;
};