export type LearningAreaFormData = {
  id?: number;
  name: string;
  gradeLevel: string;                // stored as string in the form; cast to Number on submit
  curriculum: string;
  writtenWorkWeight: string;         // stored as "0.3" etc.; cast to Float on submit
  performanceTaskWeight: string;
  quarterlyAssessmentWeight: string;
};