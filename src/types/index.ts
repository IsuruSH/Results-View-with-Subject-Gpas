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
  confirmedCredits?: number;
  nonDegreeSubjects?: string[];
}

export interface MentorDetails {
  name: string;
  designation: string;
  department: string;
  email: string;
  internalTp: string;
  residence: string;
  mobile: string;
}

export interface HomeData {
  studentName: string;
  mentor: MentorDetails;
  photoUrl: string;
}

export interface Notice {
  id: number;
  date: string;
  time: string;
  title: string;
  fileUrl: string;
  fileType: "pdf" | "docx" | "png" | "jpg" | "other";
}

export interface NoticesData {
  recentNotices: Notice[];
  previousNotices: Notice[];
}

export interface RegisteredCourse {
  code: string;
  name: string;
  degreeStatus: string;
  confirmation: string;
}

export interface CurrentSemester {
  academicYear: string;
  semester: string;
  credits: number;
  courses: RegisteredCourse[];
}

export interface CourseRegistrationData {
  currentSemester: CurrentSemester;
  allCourses: RegisteredCourse[];
  totalConfirmedCredits: number;
  departments: string[];
  nonDegreeSubjects: string[];
}

export interface AuthContextType {
  session: string | null;
  username: string | null;
  /** Read and consume the results pre-fetched during login (returns null after first call). */
  consumeInitialResults: () => GpaResults | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
