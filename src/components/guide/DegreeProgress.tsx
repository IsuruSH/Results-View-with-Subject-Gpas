import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Info,
} from "lucide-react";
import type {
  GpaResults,
  CourseRegistrationData,
  SubjectBreakdownRow,
} from "../../types";
import {
  isCoreCourse,
  hasTheoryComponent,
  hasPracticalComponent,
  isKnownCourse,
} from "../../data/courseClassifications";

// ---------------------------------------------------------------------------
// Degree program definitions
// ---------------------------------------------------------------------------

type DegreeType =
  | "bsc-general"
  | "bsc-special-selection"
  | "bsc-special-completion"
  | "bcs-general"
  | "bcs-special-selection"
  | "bcs-special-completion";

interface DegreeProgram {
  id: DegreeType;
  label: string;
  shortLabel: string;
  family: "bsc" | "bcs";
}

const DEGREE_PROGRAMS: DegreeProgram[] = [
  {
    id: "bsc-general",
    label: "BSc General Degree",
    shortLabel: "BSc General",
    family: "bsc",
  },
  {
    id: "bsc-special-selection",
    label: "BSc Special Degree – Selection",
    shortLabel: "BSc Special (Sel.)",
    family: "bsc",
  },
  {
    id: "bsc-special-completion",
    label: "BSc Special Degree – Completion",
    shortLabel: "BSc Special (Comp.)",
    family: "bsc",
  },
  {
    id: "bcs-general",
    label: "BCS General Degree",
    shortLabel: "BCS General",
    family: "bcs",
  },
  {
    id: "bcs-special-selection",
    label: "BCS Special Degree – Selection",
    shortLabel: "BCS Special (Sel.)",
    family: "bcs",
  },
  {
    id: "bcs-special-completion",
    label: "BCS Special Degree – Completion",
    shortLabel: "BCS Special (Comp.)",
    family: "bcs",
  },
];

// ---------------------------------------------------------------------------
// Requirement types
// ---------------------------------------------------------------------------

/** A requirement that CAN be computed from current data. */
interface ComputableRequirement {
  type: "computable";
  label: string;
  current: number;
  target: number;
  unit: string; // "credits" | "%" | "GPA" | "levels" | "pass"
  met: boolean;
  detail?: string;
  subjects?: SubjectBreakdownRow[];
  thresholdGS?: number;
}

/** A requirement that CANNOT be computed - show info card explaining why. */
interface UnavailableRequirement {
  type: "unavailable";
  label: string;
  reason: string;
}

type Requirement = ComputableRequirement | UnavailableRequirement;

// ---------------------------------------------------------------------------
// BCS Core subjects are now managed in data/courseClassifications.ts
// ---------------------------------------------------------------------------

/** Normalize a subject code: lowercase + Greek→Latin credit char. */
function norm(code: string): string {
  return code
    .toLowerCase()
    .replace("\u03b1", "a") // α
    .replace("\u03b2", "b") // β
    .replace("\u03b4", "d"); // δ
}

// isBcsCore removed in favor of isCoreCourse from classification data

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CS_PREFIXES = ["CSC", "COM"];
const MATH_PREFIXES = ["MAT", "AMT", "IMT"];

function creditsWithMinGrade(
  subjects: SubjectBreakdownRow[],
  minGS: number
): number {
  let sum = 0;
  for (const s of subjects)
    if (s.credit > 0 && s.gradeScale >= minGS) sum += s.credit;
  return sum;
}

function totalCredits(subjects: SubjectBreakdownRow[]): number {
  let sum = 0;
  for (const s of subjects) if (s.credit > 0) sum += s.credit;
  return sum;
}

function pctWithGrade(subjects: SubjectBreakdownRow[], minGS: number): number {
  const tot = totalCredits(subjects);
  if (tot === 0) return 0;
  return Math.round((creditsWithMinGrade(subjects, minGS) / tot) * 100);
}

function checkEnglish(subjects: SubjectBreakdownRow[], level: number): boolean {
  const prefix = `eng${level}`;
  // Both BSc and BCS require a minimum of C grade (2.0) for English units
  return subjects.some(
    (s) => norm(s.subjectCode).startsWith(prefix) && s.gradeScale >= 2.0
  );
}

function yearLevel(subjects: SubjectBreakdownRow[], yearDigit: string) {
  return subjects.filter((s) => {
    const digits = s.subjectCode.replace(/^[A-Za-z]+/, "");
    return digits[0] === yearDigit;
  });
}

function findSubject(
  subjects: SubjectBreakdownRow[],
  keywords: string[]
): SubjectBreakdownRow | undefined {
  const kw = keywords.map((k) => k.toLowerCase());
  return subjects.find((s) => {
    const name = s.subjectName.toLowerCase();
    const code = s.subjectCode.toLowerCase();
    return kw.some((k) => name.includes(k) || code.includes(k));
  });
}

function creditsWithGradeA(subjects: SubjectBreakdownRow[]): number {
  let sum = 0;
  for (const s of subjects)
    if (s.credit > 0 && s.gradeScale >= 3.7) sum += s.credit;
  return sum;
}

function creditsWithGradeB(subjects: SubjectBreakdownRow[]): number {
  let sum = 0;
  for (const s of subjects)
    if (s.credit > 0 && s.gradeScale >= 2.7) sum += s.credit;
  return sum;
}

/** Partition BCS subjects into Core vs Optional using handbook classification data. */
function partitionBcs(creditSubjects: SubjectBreakdownRow[]) {
  const core: SubjectBreakdownRow[] = [];
  const optional: SubjectBreakdownRow[] = [];
  for (const s of creditSubjects) {
    if (isCoreCourse(s.subjectCode)) core.push(s);
    else optional.push(s);
  }
  return { core, optional };
}

/** Split BCS core into CS-core and Maths-core for reporting. */
function splitBcsCore(core: SubjectBreakdownRow[]) {
  const cs: SubjectBreakdownRow[] = [];
  const maths: SubjectBreakdownRow[] = [];
  const other: SubjectBreakdownRow[] = [];
  for (const s of core) {
    const up = s.subjectCode.toUpperCase();
    if (CS_PREFIXES.some((p) => up.startsWith(p))) cs.push(s);
    else if (MATH_PREFIXES.some((p) => up.startsWith(p))) maths.push(s);
    else other.push(s); // PHY etc. that are core
  }
  return { cs, maths, other };
}

const SPEC_SUBJECT_REASON =
  "Cannot be calculated — we cannot determine which subject you are specializing in from the available data.";

/** Partition BSc subjects into core-theory, core-practical, and optional using handbook data. */
function partitionBsc(creditSubjects: SubjectBreakdownRow[]) {
  const coreTheory: SubjectBreakdownRow[] = [];
  const corePractical: SubjectBreakdownRow[] = []; // practical or combined core
  const optional: SubjectBreakdownRow[] = [];
  const unknown: SubjectBreakdownRow[] = [];
  for (const s of creditSubjects) {
    const code = s.subjectCode;
    if (!isKnownCourse(code)) {
      unknown.push(s);
      continue;
    }
    if (isCoreCourse(code)) {
      if (hasPracticalComponent(code) && !hasTheoryComponent(code)) {
        corePractical.push(s);
      } else if (hasPracticalComponent(code)) {
        // combined: counts for both checks
        coreTheory.push(s);
        corePractical.push(s);
      } else {
        coreTheory.push(s);
      }
    } else {
      optional.push(s);
    }
  }
  return { coreTheory, corePractical, optional, unknown };
}

// ---------------------------------------------------------------------------
// Requirement builders
// ---------------------------------------------------------------------------

function buildRequirements(
  degreeType: DegreeType,
  gpa: number,
  confirmedCredits: number,
  subjects: SubjectBreakdownRow[],
  nonDegree: string[]
): Requirement[] {
  const creditSubjects = subjects.filter(
    (s) => s.credit > 0 && !nonDegree.includes(s.subjectCode.toUpperCase())
  );

  const eng1 = checkEnglish(subjects, 1);
  const eng2 = checkEnglish(subjects, 2);
  const eng3 = checkEnglish(subjects, 3);

  // BCS: use real curriculum data to split Core/Optional
  const { core: bcsCore, optional: bcsOptional } = partitionBcs(creditSubjects);
  const { cs: bcsCoreCs, maths: bcsCoreMaths } = splitBcsCore(bcsCore);

  const reqs: Requirement[] = [];

  // Shared helpers
  const engReq12 = (): ComputableRequirement => ({
    type: "computable",
    label: "English Level I & II",
    current: [eng1, eng2].filter(Boolean).length,
    target: 2,
    unit: "levels",
    met: eng1 && eng2,
    detail: `Level I: ${eng1 ? "Passed" : "Pending"}, Level II: ${eng2 ? "Passed" : "Pending"}`,
    subjects: subjects.filter((s) => {
      const nCode = norm(s.subjectCode);
      return nCode.startsWith("eng1") || nCode.startsWith("eng2");
    }),
    thresholdGS: 2.0,
  });
  const engReq123 = (): ComputableRequirement => ({
    type: "computable",
    label: "English Level I, II & III",
    current: [eng1, eng2, eng3].filter(Boolean).length,
    target: 3,
    unit: "levels",
    met: eng1 && eng2 && eng3,
    detail: `I: ${eng1 ? "Passed" : "Pending"}, II: ${eng2 ? "Passed" : "Pending"}, III: ${eng3 ? "Passed" : "Pending"}`,
    subjects: subjects.filter((s) => {
      const nCode = norm(s.subjectCode);
      return nCode.startsWith("eng1") || nCode.startsWith("eng2") || nCode.startsWith("eng3");
    }),
    thresholdGS: 2.0,
  });

  const industryPlacement = findSubject(creditSubjects, [
    "industry",
    "placement",
    "industrial",
  ]);
  const researchProject = findSubject(creditSubjects, [
    "research project",
    "individual project",
  ]);

  switch (degreeType) {
    // =====================================================================
    // BSc GENERAL
    // =====================================================================
    case "bsc-general": {
      const { coreTheory: bscCoreTheory, corePractical: bscCorePrac, optional: bscOptional } =
        partitionBsc(creditSubjects);
      const pctCoreTheoryC = pctWithGrade(bscCoreTheory, 2.0);
      const pctOptDPlus = pctWithGrade(bscOptional, 1.3);
      const allCorePracCMinus = bscCorePrac.length === 0
        ? true
        : bscCorePrac.every((s) => s.gradeScale >= 1.7);

      reqs.push(
        {
          type: "computable",
          label: "Credits Registered (≥ 90)",
          current: confirmedCredits,
          target: 90,
          unit: "credits",
          met: confirmedCredits >= 90,
          subjects: creditSubjects,
          thresholdGS: 0.001,
        },
        {
          type: "computable",
          label: "60% of Core Courses (Theory) with C grade",
          current: pctCoreTheoryC,
          target: 60,
          unit: "%",
          met: pctCoreTheoryC >= 60,
          detail: `${creditsWithMinGrade(bscCoreTheory, 2.0)} of ${totalCredits(bscCoreTheory)} core theory credits`,
          subjects: bscCoreTheory,
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "60% of Optional Course Units with D+ grade",
          current: pctOptDPlus,
          target: 60,
          unit: "%",
          met: pctOptDPlus >= 60,
          detail: `${creditsWithMinGrade(bscOptional, 1.3)} of ${totalCredits(bscOptional)} optional credits`,
          subjects: bscOptional,
          thresholdGS: 1.3,
        },
        {
          type: "computable",
          label: "All Core Course Unit Practicals with C-",
          current: allCorePracCMinus ? bscCorePrac.length : bscCorePrac.filter((s) => s.gradeScale >= 1.7).length,
          target: bscCorePrac.length,
          unit: "courses",
          met: allCorePracCMinus,
          detail: bscCorePrac.length > 0
            ? `${bscCorePrac.filter((s) => s.gradeScale >= 1.7).length} of ${bscCorePrac.length} core practicals passed`
            : "No core practical courses found yet",
          subjects: bscCorePrac,
          thresholdGS: 1.7,
        },
        {
          type: "computable",
          label: "Overall GPA (≥ 2.00)",
          current: gpa,
          target: 2.0,
          unit: "GPA",
          met: gpa >= 2.0,
          subjects: creditSubjects,
          thresholdGS: 2.0,
        },
        engReq12()
      );
      // CLC check for non-CS students (BSc)
      const hasCsSubs = creditSubjects.some((s) =>
        CS_PREFIXES.some((p) => s.subjectCode.toUpperCase().startsWith(p))
      );
      if (!hasCsSubs) {
        const clcSubject = findSubject(subjects, ["clc", "computer literacy", "ict1b13"]);
        reqs.push({
          type: "computable",
          label: "CLC (Computer Literacy Certificate)",
          current: clcSubject && clcSubject.gradeScale > 0 ? 1 : 0,
          target: 1,
          unit: "pass",
          met: !!clcSubject && clcSubject.gradeScale > 0,
          detail: clcSubject
            ? `${clcSubject.subjectCode}: ${clcSubject.grade}`
            : "Not found in results",
          subjects: clcSubject ? [clcSubject] : [],
          thresholdGS: 0.001,
        });
      }
      break;
    }

    // =====================================================================
    // BSc SPECIAL – SELECTION
    // =====================================================================
    case "bsc-special-selection": {
      reqs.push(
        {
          type: "computable",
          label: "Credits Registered (≥ 60)",
          current: confirmedCredits,
          target: 60,
          unit: "credits",
          met: confirmedCredits >= 60,
          subjects: creditSubjects,
          thresholdGS: 0.001,
        },
        {
          type: "unavailable",
          label: "60% of Credits in the relevant subjects with C (Theory)",
          reason: SPEC_SUBJECT_REASON,
        },
        {
          type: "unavailable",
          label:
            "All Practical Course Units of specializing subject with C-",
          reason: SPEC_SUBJECT_REASON,
        },
        {
          type: "unavailable",
          label: "Other Practicals: D+ (Optional), C- (Core)",
          reason: SPEC_SUBJECT_REASON,
        },
        {
          type: "computable",
          label: "Overall GPA (≥ 2.00)",
          current: gpa,
          target: 2.0,
          unit: "GPA",
          met: gpa >= 2.0,
          subjects: creditSubjects,
          thresholdGS: 2.0,
        },
        {
          type: "unavailable",
          label: "80% of specializing subject with B-",
          reason: SPEC_SUBJECT_REASON,
        },
        engReq12()
      );
      break;
    }

    // =====================================================================
    // BSc SPECIAL – COMPLETION
    // =====================================================================
    case "bsc-special-completion": {
      const y4 = yearLevel(creditSubjects, "4");
      const pctY4C = pctWithGrade(y4, 2.0);

      reqs.push(
        {
          type: "computable",
          label: "Overall GPA (≥ 2.00)",
          current: gpa,
          target: 2.0,
          unit: "GPA",
          met: gpa >= 2.0,
        },
        {
          type: "unavailable",
          label: "52 Credits in specializing subject",
          reason: SPEC_SUBJECT_REASON,
        },
        {
          type: "unavailable",
          label: "60% of specialization Theory credits with C",
          reason: SPEC_SUBJECT_REASON,
        },
        {
          type: "unavailable",
          label: "All Practicals of specialization with C-",
          reason: SPEC_SUBJECT_REASON,
        },
        {
          type: "computable",
          label: "Research Project with C",
          current: researchProject ? researchProject.gradeScale : 0,
          target: 2.0,
          unit: "GPA",
          met: !!researchProject && researchProject.gradeScale >= 2.0,
          detail: researchProject
            ? `${researchProject.subjectCode} (${researchProject.subjectName}): ${researchProject.grade}`
            : "Not found in results yet",
          subjects: researchProject ? [researchProject] : [],
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "4th Year Courses with C (≥ 70%)",
          current: pctY4C,
          target: 70,
          unit: "%",
          met: pctY4C >= 70,
          detail:
            y4.length > 0
              ? `${creditsWithMinGrade(y4, 2.0)} of ${totalCredits(y4)} level-4 credits`
              : "No level-4 subjects found yet",
          subjects: y4,
          thresholdGS: 2.0,
        },
        engReq123()
      );
      // CLC for non-CS (BSc Special Completion)
      const hasCsSubsComp = creditSubjects.some((s) =>
        CS_PREFIXES.some((p) => s.subjectCode.toUpperCase().startsWith(p))
      );
      if (!hasCsSubsComp) {
        const clcSubject = findSubject(subjects, ["clc", "computer literacy"]);
        reqs.push({
          type: "computable",
          label: "CLC (Computer Literacy Certificate)",
          current: clcSubject && clcSubject.gradeScale > 0 ? 1 : 0,
          target: 1,
          unit: "pass",
          met: !!clcSubject && clcSubject.gradeScale > 0,
          detail: clcSubject
            ? `${clcSubject.subjectCode}: ${clcSubject.grade}`
            : "Not found in results",
        });
      }
      break;
    }

    // =====================================================================
    // BCS GENERAL – uses real curriculum Core/Optional split
    // =====================================================================
    case "bcs-general": {
      const pctCsCoreC = pctWithGrade(bcsCoreCs, 2.0);
      const pctMathCoreC = pctWithGrade(bcsCoreMaths, 2.0);
      const pctOptC = pctWithGrade(bcsOptional, 2.0);

      reqs.push(
        {
          type: "computable",
          label: "Credits Registered (≥ 90)",
          current: confirmedCredits,
          target: 90,
          unit: "credits",
          met: confirmedCredits >= 90,
          subjects: creditSubjects,
          thresholdGS: 0.001,
        },
        {
          type: "computable",
          label: "CS Core with C grade (≥ 60%)",
          current: pctCsCoreC,
          target: 60,
          unit: "%",
          met: pctCsCoreC >= 60,
          detail: `${creditsWithMinGrade(bcsCoreCs, 2.0)} of ${totalCredits(bcsCoreCs)} CS core credits`,
          subjects: bcsCoreCs,
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "Maths Core with C grade (≥ 60%)",
          current: pctMathCoreC,
          target: 60,
          unit: "%",
          met: pctMathCoreC >= 60,
          detail: `${creditsWithMinGrade(bcsCoreMaths, 2.0)} of ${totalCredits(bcsCoreMaths)} Maths core credits`,
          subjects: bcsCoreMaths,
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "Optional with C grade (≥ 60%)",
          current: pctOptC,
          target: 60,
          unit: "%",
          met: pctOptC >= 60,
          detail: `${creditsWithMinGrade(bcsOptional, 2.0)} of ${totalCredits(bcsOptional)} optional credits`,
          subjects: bcsOptional,
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "Industry Placement with C",
          current: industryPlacement ? industryPlacement.gradeScale : 0,
          target: 2.0,
          unit: "GPA",
          met: !!industryPlacement && industryPlacement.gradeScale >= 2.0,
          detail: industryPlacement
            ? `${industryPlacement.subjectCode} (${industryPlacement.subjectName}): ${industryPlacement.grade}`
            : "Not found in results yet",
          subjects: industryPlacement ? [industryPlacement] : [],
          thresholdGS: 2.0,
        },
        engReq12()
      );
      break;
    }

    // =====================================================================
    // BCS SPECIAL – SELECTION – uses real curriculum data
    // =====================================================================
    case "bcs-special-selection": {
      // For BCS Special Selection: CS and Maths counts come from ALL CS/Maths subjects (core)
      const allCs = [...bcsCoreCs, ...bcsOptional.filter((s) => {
        const up = s.subjectCode.toUpperCase();
        return CS_PREFIXES.some((p) => up.startsWith(p));
      })];
      const allMaths = [...bcsCoreMaths, ...bcsOptional.filter((s) => {
        const up = s.subjectCode.toUpperCase();
        return MATH_PREFIXES.some((p) => up.startsWith(p));
      })];
      const pctCsBMinus = pctWithGrade(allCs, 2.7);
      const pctMathC = pctWithGrade(allMaths, 2.0);

      reqs.push(
        {
          type: "computable",
          label: "Credits Registered (≥ 90)",
          current: confirmedCredits,
          target: 90,
          unit: "credits",
          met: confirmedCredits >= 90,
          subjects: creditSubjects,
          thresholdGS: 0.001,
        },
        {
          type: "computable",
          label: "CS Courses with B- (≥ 80%)",
          current: pctCsBMinus,
          target: 80,
          unit: "%",
          met: pctCsBMinus >= 80,
          detail: `${creditsWithMinGrade(allCs, 2.7)} of ${totalCredits(allCs)} CS credits`,
          subjects: allCs,
          thresholdGS: 2.7,
        },
        {
          type: "computable",
          label: "Maths Courses with C (≥ 60%)",
          current: pctMathC,
          target: 60,
          unit: "%",
          met: pctMathC >= 60,
          detail: `${creditsWithMinGrade(allMaths, 2.0)} of ${totalCredits(allMaths)} Maths credits`,
          subjects: allMaths,
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "Level I & II Core Grades (all ≥ C)",
          current: bcsCore.filter(s => {
            const y = parseInt(s.subjectCode.replace(/^[A-Za-z]+/, "")[0], 10);
            return (y === 1 || y === 2) && s.gradeScale >= 2.0;
          }).length,
          target: bcsCore.filter(s => {
            const y = parseInt(s.subjectCode.replace(/^[A-Za-z]+/, "")[0], 10);
            return (y === 1 || y === 2);
          }).length,
          unit: "units",
          met: bcsCore.every(s => {
            const y = parseInt(s.subjectCode.replace(/^[A-Za-z]+/, "")[0], 10);
            if (y === 1 || y === 2) return s.gradeScale >= 2.0;
            return true;
          }),
          detail: "All Level I and II core subjects must have at least a C grade",
          subjects: bcsCore.filter(s => {
            const y = parseInt(s.subjectCode.replace(/^[A-Za-z]+/, "")[0], 10);
            return (y === 1 || y === 2);
          }),
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "CSC2123 Grade (≥ C)",
          current: findSubject(subjects, ["CSC2123"])?.gradeScale || 0,
          target: 2.0,
          unit: "GPA",
          met: (findSubject(subjects, ["CSC2123"])?.gradeScale || 0) >= 2.0,
          detail: "CSC2123 (Object Oriented Programming) requirement",
          subjects: subjects.filter(s => s.subjectCode.toUpperCase() === "CSC2123"),
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "Industry Placement with C",
          current: industryPlacement ? industryPlacement.gradeScale : 0,
          target: 2.0,
          unit: "GPA",
          met: !!industryPlacement && industryPlacement.gradeScale >= 2.0,
          detail: industryPlacement
            ? `${industryPlacement.subjectCode} (${industryPlacement.subjectName}): ${industryPlacement.grade}`
            : "Not found in results yet",
          subjects: industryPlacement ? [industryPlacement] : [],
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "Overall GPA (≥ 2.00)",
          current: gpa,
          target: 2.0,
          unit: "GPA",
          met: gpa >= 2.0,
          subjects: creditSubjects,
          thresholdGS: 2.0,
        },
        engReq12()
      );
      break;
    }

    // =====================================================================
    // BCS SPECIAL – COMPLETION
    // =====================================================================
    case "bcs-special-completion": {
      const y4 = yearLevel(creditSubjects, "4");
      const pctY4C = pctWithGrade(y4, 2.0);
      const y4Credits = totalCredits(y4);

      reqs.push(
        {
          type: "computable",
          label: "Credits Registered (≥ 120, 30 in 4th yr)",
          current: confirmedCredits,
          target: 120,
          unit: "credits",
          met: confirmedCredits >= 120,
          detail: `Total: ${confirmedCredits} credits · 4th year: ${y4Credits} credits (need 30)`,
          subjects: creditSubjects,
          thresholdGS: 0.001,
        },
        {
          type: "computable",
          label: "Overall GPA (≥ 2.50)",
          current: gpa,
          target: 2.5,
          unit: "GPA",
          met: gpa >= 2.5,
          subjects: creditSubjects,
          thresholdGS: 2.5,
        },
        {
          type: "computable",
          label: "Research Project with C",
          current: researchProject ? researchProject.gradeScale : 0,
          target: 2.0,
          unit: "GPA",
          met: !!researchProject && researchProject.gradeScale >= 2.0,
          detail: researchProject
            ? `${researchProject.subjectCode} (${researchProject.subjectName}): ${researchProject.grade}`
            : "Not found in results yet",
          subjects: researchProject ? [researchProject] : [],
          thresholdGS: 2.0,
        },
        {
          type: "computable",
          label: "4th Year Courses with C (≥ 70%)",
          current: pctY4C,
          target: 70,
          unit: "%",
          met: pctY4C >= 70,
          detail:
            y4.length > 0
              ? `${creditsWithMinGrade(y4, 2.0)} of ${y4Credits} level-4 credits`
              : "No level-4 subjects found yet",
          subjects: y4,
          thresholdGS: 2.0,
        },
        engReq123()
      );
      break;
    }
  }

  // -----------------------------------------------------------------------
  // Honours classification (always appended)
  // -----------------------------------------------------------------------
  const credA = creditsWithGradeA(creditSubjects);
  const credB = creditsWithGradeB(creditSubjects);
  reqs.push(
    {
      type: "computable",
      label: "1st Class: GPA ≥ 3.70 & 40+ credits A",
      current: credA,
      target: 40,
      unit: "credits (A)",
      met: gpa >= 3.7 && credA >= 40,
      detail: `GPA: ${gpa.toFixed(2)} (need 3.70) · ${credA} credits with A-/A/A+`,
      subjects: creditSubjects,
      thresholdGS: 3.7,
    },
    {
      type: "computable",
      label: "2nd Upper: GPA ≥ 3.30 & 40+ credits B",
      current: credB,
      target: 40,
      unit: "credits (B)",
      met: gpa >= 3.3 && credB >= 40,
      detail: `GPA: ${gpa.toFixed(2)} (need 3.30) · ${credB} credits with B- or above`,
      subjects: creditSubjects,
      thresholdGS: 2.7,
    },
    {
      type: "computable",
      label: "2nd Lower: GPA ≥ 3.00 & 40+ credits B",
      current: credB,
      target: 40,
      unit: "credits (B)",
      met: gpa >= 3.0 && credB >= 40,
      detail: `GPA: ${gpa.toFixed(2)} (need 3.00) · ${credB} credits with B- or above`,
      subjects: creditSubjects,
      thresholdGS: 2.7,
    }
  );

  return reqs;
}

// ---------------------------------------------------------------------------
// Requirement Card – computable
// ---------------------------------------------------------------------------

function ComputableCard({
  req,
  isOpen,
  onToggle,
}: {
  req: ComputableRequirement;
  isOpen: boolean;
  onToggle: () => void;
}) {

  const pct =
    req.unit === "GPA"
      ? Math.min((req.current / 4.0) * 100, 100)
      : req.unit === "pass"
        ? req.met
          ? 100
          : 0
        : Math.min((req.current / req.target) * 100, 100);

  const StatusIcon = req.met
    ? CheckCircle2
    : pct >= 70
      ? AlertTriangle
      : XCircle;
  const statusColor = req.met
    ? "text-emerald-500"
    : pct >= 70
      ? "text-amber-500"
      : "text-red-400";
  const barColor = req.met
    ? "bg-emerald-500"
    : pct >= 70
      ? "bg-amber-500"
      : "bg-red-400";
  const bgColor = req.met
    ? "bg-emerald-50/50"
    : pct >= 70
      ? "bg-amber-50/50"
      : "bg-red-50/30";

  const sortedSubjects = useMemo(() => {
    if (!req.subjects) return [];
    return [...req.subjects].sort((a, b) => {
      const aPass = req.thresholdGS !== undefined ? a.gradeScale >= req.thresholdGS : true;
      const bPass = req.thresholdGS !== undefined ? b.gradeScale >= req.thresholdGS : true;
      if (aPass && !bPass) return -1;
      if (!aPass && bPass) return 1;
      return a.subjectCode.localeCompare(b.subjectCode);
    });
  }, [req.subjects, req.thresholdGS]);

  return (
    <div
      className={`rounded-xl border border-gray-100 transition-all ${bgColor} overflow-hidden`}
    >
      <div
        className="p-4 cursor-pointer hover:bg-black/5"
        onClick={() => req.subjects && req.subjects.length > 0 && onToggle()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-700 leading-tight flex-1">
            {req.label}
          </p>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${statusColor} flex-shrink-0 mt-0.5`} />
            {req.subjects && req.subjects.length > 0 && (
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-xl font-bold text-gray-900">
            {req.unit === "GPA"
              ? req.current.toFixed(2)
              : req.unit === "pass"
                ? req.met
                  ? "Passed"
                  : "Pending"
                : req.current}
          </span>
          {req.unit !== "pass" && (
            <span className="text-xs text-gray-400 pb-0.5">
              / {req.unit === "GPA" ? req.target.toFixed(2) : req.target}{" "}
              {req.unit}
            </span>
          )}
        </div>

        <div className="w-full bg-gray-200/60 rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>

        {req.detail && !isOpen && (
          <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">
            {req.detail}
          </p>
        )}
      </div>

      {isOpen && req.subjects && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100/50 bg-white/40">
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 mt-1">
              <span>Included Subjects ({req.subjects.length})</span>
              <span>Grade / Cr</span>
            </div>
            {sortedSubjects.map((s, idx) => {
              const fulfills = req.thresholdGS !== undefined ? s.gradeScale >= req.thresholdGS : true;
              return (
                <div key={idx} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-100/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${fulfills ? "bg-emerald-400" : "bg-red-400"}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-700 truncate">{s.subjectCode}</p>
                      <p className="text-[9px] text-gray-500 truncate">{s.subjectName}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[11px] font-bold ${fulfills ? 'text-emerald-600' : 'text-red-500'}`}>{s.grade}</p>
                    <p className="text-[9px] text-gray-400">{s.credit > 0 ? `${s.credit} Cr` : 'N/C'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requirement Card – unavailable
// ---------------------------------------------------------------------------

function UnavailableCard({ req }: { req: UnavailableRequirement }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-gray-700 leading-tight flex-1">
          {req.label}
        </p>
      </div>
      <p className="text-[10px] text-blue-500/80 leading-relaxed">
        {req.reason}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface DegreeProgressProps {
  results: GpaResults | null;
  courseData: CourseRegistrationData | null;
  loading: boolean;
}

export default function DegreeProgress({
  results,
  courseData,
  loading,
}: DegreeProgressProps) {
  const [showPicker, setShowPicker] = useState(false);

  const gpa = results?.gpa ? parseFloat(results.gpa) : 0;
  const confirmedCredits =
    courseData?.totalConfirmedCredits ?? results?.confirmedCredits ?? 0;
  const subjects = results?.subjectBreakdown ?? [];
  const nonDegree = (results?.nonDegreeSubjects ?? []).map((s) =>
    s.toUpperCase()
  );

  // Detect BCS vs BSc
  const isBcs = useMemo(() => {
    const deps = courseData?.departments ?? [];
    const hasCsDept = deps.some(
      (d) =>
        d.toUpperCase().includes("BCS") ||
        d.toUpperCase().includes("COMPUTER SCIENCE")
    );
    if (hasCsDept) return true;

    if (subjects.length > 0) {
      const creditSubs = subjects.filter(
        (s) => s.credit > 0 && !nonDegree.includes(s.subjectCode.toUpperCase())
      );
      let csCredits = 0;
      let total = 0;
      for (const s of creditSubs) {
        total += s.credit;
        const up = s.subjectCode.toUpperCase();
        if (CS_PREFIXES.some((p) => up.startsWith(p))) csCredits += s.credit;
      }
      if (total > 0 && csCredits / total > 0.4) return true;
    }
    return false;
  }, [courseData, subjects, nonDegree]);

  const availablePrograms = useMemo(
    () => DEGREE_PROGRAMS.filter((p) => p.family === (isBcs ? "bcs" : "bsc")),
    [isBcs]
  );

  const [degreeType, setDegreeType] = useState<DegreeType>("bcs-general");
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  useEffect(() => {
    const defaultType: DegreeType = isBcs ? "bcs-general" : "bsc-general";
    setDegreeType((prev) => {
      const family = isBcs ? "bcs" : "bsc";
      if (!prev.startsWith(family)) return defaultType;
      return prev;
    });
  }, [isBcs]);

  const requirements = useMemo(
    () =>
      buildRequirements(degreeType, gpa, confirmedCredits, subjects, nonDegree),
    [degreeType, gpa, confirmedCredits, subjects, nonDegree]
  );

  // Partition
  const isHonours = (r: Requirement) =>
    r.type === "computable" &&
    (r.label.startsWith("1st Class") || r.label.startsWith("2nd"));
  const baseReqs = requirements.filter((r) => !isHonours(r));
  const honoursReqs = requirements.filter(isHonours) as ComputableRequirement[];

  // Count met only among computable base reqs
  const computableBase = baseReqs.filter(
    (r) => r.type === "computable"
  ) as ComputableRequirement[];
  const metBaseCount = computableBase.filter((r) => r.met).length;
  const totalBaseComputable = computableBase.length;
  const unavailableCount = baseReqs.filter(
    (r) => r.type === "unavailable"
  ).length;
  const overallPct =
    totalBaseComputable > 0
      ? Math.round((metBaseCount / totalBaseComputable) * 100)
      : 0;

  const selectedProgram =
    availablePrograms.find((p) => p.id === degreeType) ??
    availablePrograms[0];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">
            Analyzing your degree progress...
          </span>
        </div>
      </div>
    );
  }

  if (!results || !subjects.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Disclaimer:</span> The requirements listed below are
          for informational purposes only and may not reflect the latest official regulations.
          Always refer to the official Faculty of Science handbook or consult your academic
          advisor for accurate and up-to-date information.
        </p>
      </div>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Your Degree Progress
            </h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              {isBcs ? "BCS" : "BSc"} stream · Based on your current results
              &amp; registered credits
            </p>
          </div>

          {/* Degree type selector */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors"
            >
              {selectedProgram.shortLabel}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showPicker && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPicker(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20">
                  {availablePrograms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setDegreeType(p.id);
                        setShowPicker(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${p.id === degreeType
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-indigo-200">
              {metBaseCount} of {totalBaseComputable} computable requirements met
              {unavailableCount > 0 && (
                <span className="ml-1 opacity-70">
                  · {unavailableCount} need manual check
                </span>
              )}
            </span>
            <span className="text-sm font-bold text-white">{overallPct}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${overallPct >= 80
                ? "bg-emerald-400"
                : overallPct >= 50
                  ? "bg-amber-400"
                  : "bg-red-400"
                }`}
            />
          </div>
        </div>
      </div>

      {/* Requirement cards grid */}
      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Degree Requirements
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
          {baseReqs.map((req, i) => {
            const id = `base-${i}`;
            return req.type === "computable" ? (
              <ComputableCard
                key={`${degreeType}-base-${i}`}
                req={req}
                isOpen={openCardId === id}
                onToggle={() => setOpenCardId(openCardId === id ? null : id)}
              />
            ) : (
              <UnavailableCard key={`${degreeType}-base-${i}`} req={req} />
            );
          })}
        </div>

        {/* Honours classification */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-3">
          Honours Classification
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          {honoursReqs.map((req, i) => {
            const id = `hon-${i}`;
            return (
              <ComputableCard
                key={`${degreeType}-hon-${i}`}
                req={req}
                isOpen={openCardId === id}
                onToggle={() => setOpenCardId(openCardId === id ? null : id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
