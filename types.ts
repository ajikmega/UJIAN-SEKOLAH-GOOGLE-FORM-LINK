
export enum Role {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string;
  role: Role;
  className?: string; // For students
  fullName?: string;
}

export type ExamMode = 'GOOGLE_FORM' | 'NATIVE';

export interface SubjectLink {
  title: string;
  url: string;
}

export interface Exam {
  id: string;
  title: string;
  mode: ExamMode;
  googleFormUrl?: string;
  subjectLinks?: SubjectLink[]; // NEW: Array of subjects for multi-subject session
  examPackageId?: string; // For Native exams
  token: string;
  useToken: boolean; // NEW: Option to enable/disable token
  durationMinutes: number;
  isActive: boolean;
  assignedClasses: string[];
  startTime?: string;
  endTime?: string;
}

export interface ExamResult {
  examId: string;
  studentName: string;
  className: string;
  completedAt: string;
  status: 'COMPLETED' | 'CHEATING_SUSPECTED' | 'IN_PROGRESS';
  score?: number; // 0-100
  answers?: Record<string, string>; // QuestionID -> Answer
  violationCount?: number; // Number of times detecting tab switch/blur
}

export interface ClassGroup {
  id: string;
  name: string; // e.g., "XII-IPA-1"
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY' | 'EXTERNAL_FORM';

export interface Question {
  id: string;
  text: string; // Question text or Form Title
  type: QuestionType;
  options?: string[]; // For MC
  correctAnswer?: string; // Index (0-4) for MC or text keyword for Essay
  topic: string; // Mata Pelajaran / Topik
  googleFormUrl?: string; // For EXTERNAL_FORM
}

export interface ExamPackage {
  id: string;
  title: string;
  subject: string;
  questionIds: string[];
}