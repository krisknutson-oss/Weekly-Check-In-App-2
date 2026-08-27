export type ColorSchemeId =
  | 'sophisticated-dark'
  | 'pitch-black'
  | 'midnight-sapphire'
  | 'academic-emerald'
  | 'crimson-noir'
  | 'deep-amethyst'
  | 'pure-white'
  | 'vintage-ledger'
  | 'clean-slate'
  | 'warm-sand'
  | 'alabaster-light'
  | 'custom-bg';

export interface Student {
  id: string;
  name: string;
  pin: string; // 4-digit PIN
  avatar?: string;
  createdAt: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: 'primary' | 'co-teacher' | 'department-head' | 'ta';
  subject?: string;
  avatar?: string;
  createdAt?: number;
  resetCode?: {
    code: string;
    expiresAt: number;
  } | null;
}

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string]; // exactly 4 options
  correctIndex: number; // 0, 1, 2, 3
  explanation?: string;
}

export type WeekStatus = 'no-slides' | 'draft' | 'published';

export interface Week {
  id: string;
  title: string;
  unitTitle?: string;
  slideText: string;
  sourceFileName?: string;
  quiz: Question[];
  status: WeekStatus;
  createdAt: number;
  targetCulminatingDate?: string;
  notes?: string;
}

export interface QuizSubmission {
  answers: number[]; // chosen option index for each question
  score: number;
  total: number;
  submittedAt: number;
}

export interface ClassroomData {
  id: string;
  teacherId: string; // Isolated owner teacher ID
  classCode: string; // e.g. "SCI-301"
  className: string;
  subject?: string;
  period?: string;
  unitGoal: string;
  culminatingActivityTitle: string;
  students: Student[];
  weeks: Week[];
  results: Record<string, Record<string, QuizSubmission>>; // studentId -> weekId -> submission
  createdAt: number;
  updatedAt?: number;
}

export interface ClassroomState {
  id?: string;
  teacherId?: string;
  classCode?: string;
  students: Student[];
  teachers: Teacher[];
  weeks: Week[];
  results: Record<string, Record<string, QuizSubmission>>; // studentId -> weekId -> submission
  className: string;
  unitGoal: string;
  culminatingActivityTitle: string;
  subject?: string;
  period?: string;
}

export interface AppLedgerStore {
  teachers: Teacher[];
  classes: ClassroomData[];
  activeClassIdByTeacher: Record<string, string>; // teacherId -> classId
}

export type UserView = 
  | 'landing'
  | 'teacher-auth'
  | 'teacher-dashboard'
  | 'student-login'
  | 'student-home'
  | 'student-quiz'
  | 'student-feedback';

export type AppRoute = UserView;

export type TeacherTab = 'students' | 'weeks' | 'results' | 'faculty';
export type ResultsViewMode = 'individual' | 'class';
