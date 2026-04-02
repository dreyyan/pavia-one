export interface GeneralModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: "default" | "error" | "success" | "info" | "warning";
  confirmText: string;
  isCancelable: boolean;
  onConfirm: () => void;
}

export type LearningAreaFormData = {
  id?: number;
  name: string;
  gradeLevel: string;                // stored as string in the form; cast to Number on submit
  curriculum: string;
  writtenWorkWeight: string;         // stored as "0.3" etc.; cast to Float on submit
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
  learningModality: string;
  room: string;

  adviserId?: string;
  adviserName?: string;
};

export interface Section {
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
}

export interface AdviserSection {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  classSize: number;
}

export interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  sections: AdviserSection[];
  
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
  adviser?: { id: number; name: string; adviserId: string };
  enrollments: {
    id: number;
    sectionId: number;
    schoolYear: string;
    status: string;
    learningModality: string;
  }[];
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

export interface Enrollment {
  id: number;
  sectionId: number;
  schoolYear: string;
  status: string;
  learningModality: string;
  section?: {
    id: number;
    name: string;
    gradeLevel: number;
    curriculum: string;
  };
}

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

export interface SectionStudent {
  id: number;
  lrn: string;
  fullName: string;
  sex?: string;
  status: string;
  learningModality: string;
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

export type AdviserFormData = {
  id?: number;
  adviserId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
};

export interface AdviserSection {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  classSize: number;
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