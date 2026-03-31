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

export interface AdviserSection {
  id: number;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  curriculum: string;
  classSize: number;
  isAdvisory?: boolean;
}

export interface Adviser {
  id: number;
  adviserId: string;
  name: string;
  sections: AdviserSection[];
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