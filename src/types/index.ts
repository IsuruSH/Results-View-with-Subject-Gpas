export interface GpaFormData {
  stnum: string;
  manualSubjects: {
    subjects: string[];
    grades: string[];
  };
  repeatedSubjects: {
    subjects: string[];
    grades: string[];
  };
}

export interface RankData {
  totalCount: number;
  rank: number;
  highestGpa: number;
  lowestGpa: number;
  averageGpa: number;
}

export interface RepeatedSubject {
  subjectCode: string;
  subjectName: string;
  attempts: {
    grade: string;
    year: number;
    isLowGrade: boolean;
  }[];
  latestAttempt: {
    subjectName: string;
    grade: string;
    year: number;
  };
}

export interface SubjectBreakdownRow {
  subjectCode: string;
  subjectName: string;
  grade: string;
  credit: number;
  gradeScale: number;
  weightedPoints: number;
  year: number;
  semester: string;
}

export interface GpaResults {
  data?: string;
  message?: string;
  repeatedSubjects?: RepeatedSubject[];
  subjectBreakdown?: SubjectBreakdownRow[];
  gpa?: string;
  mathGpa?: string;
  cheGpa?: string;
  phyGpa?: string;
  zooGpa?: string;
  botGpa?: string;
  csGpa?: string;
  gradeDistribution?: Record<string, number>;
  levelGpas?: { level1?: string; level2?: string; level3?: string };
  totalCredits?: number;
  totalGradePoints?: number;
}

export interface AuthContextType {
  session: string | null;
  username: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
