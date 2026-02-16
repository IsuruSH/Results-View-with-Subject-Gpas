// ---------------------------------------------------------------------------
// Course Classification Data – Faculty of Science, University of Ruhuna
// Source: Student Handbook (StudentHandBook_fos.pdf)
// ---------------------------------------------------------------------------

/** Whether the course is compulsory or elective */
export type CourseType = "core" | "optional";

/** The nature of a course unit */
export type CourseNature = "theory" | "practical" | "combined" | "project";

export interface CourseUnit {
    code: string;
    name: string;
    credits: number;
    type: CourseType;
    nature: CourseNature;
}

// ---------------------------------------------------------------------------
// Normalise course codes: lowercase, Greek → Latin for credit chars
// ---------------------------------------------------------------------------
function n(code: string): string {
    return code
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace("\u03b1", "a")
        .replace("\u03b2", "b")
        .replace("\u03b4", "d")
        .replace("\u03b5", "e");
}

// ---------------------------------------------------------------------------
// Master lookup map: normalised-code → { type, nature }
// ---------------------------------------------------------------------------
const COURSE_MAP = new Map<string, { type: CourseType; nature: CourseNature }>();

function reg(code: string, type: CourseType, nature: CourseNature) {
    COURSE_MAP.set(n(code), { type, nature });
}

// ═══════════════════════════════════════════════════════════════════════════
// BCS GENERAL DEGREE  (Chapter 7 – handbook §7.7.1)
// ═══════════════════════════════════════════════════════════════════════════

// Level 1 – Semester 1
reg("CSC1122", "core", "theory");
reg("CSC1113", "core", "combined");
reg("CSC113α", "core", "combined");
reg("CSC1142", "core", "theory");
reg("CSC1153", "core", "practical");
reg("MAT112δ", "core", "theory");
reg("MAT113δ", "core", "theory");

// Level 1 – Semester 2
reg("CSC1213", "core", "combined");
reg("CSC1223", "core", "theory");
reg("CSC1233", "core", "theory");
reg("CSC1242", "core", "theory");
reg("CSC1251", "core", "practical");
reg("AMT112β", "core", "theory");
reg("MAT121β", "core", "theory");
reg("MAT122β", "core", "theory");

// Level 2 – Semester 1
reg("CSC2113", "core", "combined");
reg("CSC2123", "core", "combined");
reg("CSC2133", "core", "theory");
reg("CSC2143", "core", "combined");
reg("AMT212β", "core", "theory");
reg("MAT211β", "core", "theory");
reg("PHY2112", "core", "theory"); // optional for BCS per handbook

// Level 2 – Semester 2
reg("CSC2213", "core", "combined");
reg("CSC2222", "core", "theory");
reg("CSC2233", "core", "combined");
reg("CSC2242", "core", "theory");
reg("CSC2252", "core", "theory");
reg("MAT225β", "core", "theory");
// Optionals
reg("CSC2262", "optional", "theory");
reg("CSC2263", "optional", "combined"); // Multimedia and Video Production
reg("CSC2272", "optional", "combined");

// Level 3 – Semester 1
reg("CSC3113", "core", "practical");
reg("CSC3122", "optional", "theory");
reg("CSC3132", "optional", "theory");
reg("CSC3142", "optional", "theory");
reg("CSC3152", "optional", "combined");
reg("MAT313β", "optional", "combined");

// Level 3 – Semester 2
reg("CSC3216", "core", "practical");
reg("CSC3222", "optional", "theory");
reg("CSC3232", "optional", "theory");
reg("CSC3242", "optional", "theory");
reg("CSC3252", "optional", "combined");
reg("CSC3172", "optional", "theory"); // Distributed Systems (not in handbook, found in real data)

// ═══════════════════════════════════════════════════════════════════════════
// BCS HONOURS DEGREE  (Chapter 7 – handbook §7.8.2)
// ═══════════════════════════════════════════════════════════════════════════
reg("CSC4112", "core", "theory");
reg("CSC4122", "core", "theory");
reg("CSC4133", "core", "theory");
reg("CSC4046", "core", "project");
reg("CSC4152", "core", "theory");
reg("CSC4162", "core", "theory");
reg("CSC4172", "core", "theory");
reg("CSC4182", "core", "theory");
reg("CSC4212", "core", "theory");
reg("CSC4222", "core", "theory");
reg("CSC4232", "optional", "theory");
reg("CSC4242", "core", "theory");
reg("CSC4262", "optional", "theory");

// ═══════════════════════════════════════════════════════════════════════════
// BOTANY – B.Sc. General  (Chapter 5 – handbook §5.4)
// Level I & II: all core for Bio streams BS1-BS4 that include Botany
// Level III: all optional
// ═══════════════════════════════════════════════════════════════════════════

// Level 1 – Semester 1
reg("BOT1112", "core", "theory");
reg("BOT1121", "core", "theory");
reg("BOT1131", "core", "theory");
reg("BOT1141", "core", "practical");
// Level 1 – Semester 2
reg("BOT1212", "core", "theory");
reg("BOT1221", "core", "theory");
reg("BOT1231", "core", "theory");
reg("BOT1241", "core", "practical");
// Level 2 – Semester 1
reg("BOT2112", "core", "theory");
reg("BOT2121", "core", "theory");
reg("BOT2131", "core", "theory");
reg("BOT2141", "core", "practical");
// Level 2 – Semester 2
reg("BOT2212", "core", "theory");
reg("BOT2221", "core", "theory");
reg("BOT2231", "core", "theory");
reg("BOT2241", "core", "practical");
// Level 3 – Semester 1 (all optional)
reg("BOT3112", "optional", "combined");
reg("BOT3122", "optional", "combined");
reg("BOT3132", "optional", "combined");
reg("BOT3142", "optional", "combined");
reg("BOT3151", "optional", "theory"); // listed as Op in handbook
reg("BOT3162", "optional", "combined");
reg("BOT3172", "optional", "combined");
reg("BOT3182", "optional", "combined");
reg("BOT3191", "optional", "combined");
// Level 3 – Semester 2 (all optional)
reg("BOT3212", "optional", "combined");
reg("BOT3222", "optional", "combined");
reg("BOT3232", "optional", "combined");
reg("BOT3242", "optional", "combined");
reg("BOT3251", "optional", "theory");
reg("BOT3261", "optional", "theory");
reg("BOT3271", "optional", "theory");
reg("BOT3282", "optional", "combined");
reg("BOT3292", "optional", "combined");

// ═══════════════════════════════════════════════════════════════════════════
// BOTANY – B.Sc. Honours  (Chapter 5 – handbook §5.5)
// All are compulsory for Botany Honours students
// ═══════════════════════════════════════════════════════════════════════════
reg("BOT4012", "core", "combined");
reg("BOT4022", "core", "combined");
reg("BOT4032", "core", "combined");
reg("BOT4042", "core", "theory");
reg("BOT4052", "core", "combined");
reg("BOT4062", "core", "combined");
reg("BOT4072", "core", "theory");
reg("BOT4082", "core", "combined");
reg("BOT4092", "core", "combined");
reg("BOT4102", "core", "combined");
reg("BOT4112", "core", "combined");
reg("BOT4122", "core", "theory");
reg("BOT4132", "core", "combined");
reg("BOT4142", "core", "combined");
reg("BOT4152", "core", "combined");
reg("BOT4162", "core", "combined");
reg("BOT4172", "core", "combined");
reg("BOT4182", "core", "practical");
reg("BOT4192", "core", "combined");
reg("BOT4202", "core", "combined");
reg("BOT4212", "core", "combined");
reg("BOT4222", "core", "combined");
reg("BOT4232", "core", "combined");
reg("BOT4242", "core", "combined");
reg("BOT4252", "core", "practical");
reg("BOT4262", "core", "combined");
reg("BOT4276", "core", "project");
reg("BOT4282", "core", "combined");
reg("BOT4292", "core", "practical");

// ═══════════════════════════════════════════════════════════════════════════
// CHEMISTRY – B.Sc. General  (Chapter 6)
// Level I & II: core for Bio streams with CHE, and Physical streams with CHE
// Level III: all optional
// ═══════════════════════════════════════════════════════════════════════════

// Level 1 – Semester 1
reg("CHE1112", "core", "theory");
reg("CHE1122", "core", "theory");
reg("CHE1032", "core", "practical");
// Level 1 – Semester 2
reg("CHE1212", "core", "theory");
reg("CHE1222", "core", "theory");
// Level 2 – Semester 1
reg("CHE2112", "core", "theory");
reg("CHE2122", "core", "theory");
reg("CHE2131", "core", "practical");
// Level 2 – Semester 2
reg("CHE2212", "core", "theory");
reg("CHE2222", "core", "theory");
reg("CHE2231", "core", "practical");
// Level 3 – Semester 1 (optional)
reg("CHE3112", "optional", "combined");
reg("CHE3122", "optional", "combined");
reg("CHE3132", "optional", "combined");
// Level 3 – Semester 2 (optional)
reg("CHE3212", "optional", "combined");
reg("CHE3222", "optional", "combined");
reg("CHE3232", "optional", "theory");

// ═══════════════════════════════════════════════════════════════════════════
// CHEMISTRY – B.Sc. Honours  (Chapter 6)
// ═══════════════════════════════════════════════════════════════════════════
reg("CHE4012", "core", "theory");
reg("CHE4022", "core", "theory");
reg("CHE4032", "core", "theory");
reg("CHE4042", "core", "theory");
reg("CHE4052", "core", "theory");
reg("CHE4062", "core", "theory");
reg("CHE4072", "core", "theory");
reg("CHE4082", "core", "theory");
reg("CHE4092", "core", "theory");
reg("CHE4102", "core", "theory");
reg("CHE4112", "core", "theory");
reg("CHE4122", "core", "theory");
reg("CHE4132", "core", "practical");
reg("CHE4142", "core", "practical");
reg("CHE4152", "core", "practical");
reg("CHE4162", "core", "practical");
reg("CHE4172", "core", "combined");
reg("CHE4182", "core", "combined");
reg("CHE4046", "core", "project");

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTER SCIENCE (COM prefix) – for B.Sc. Physical streams
// (Chapter 7 – different from BCS/CSC-prefix courses)
// ═══════════════════════════════════════════════════════════════════════════

// Level 1
reg("COM1111", "core", "theory");
reg("COM112β", "core", "practical");
reg("COM113α", "core", "theory");
reg("COM121β", "core", "theory");
reg("COM122β", "core", "practical");
// Level 2
reg("COM212β", "core", "practical");
reg("COM213α", "core", "theory");
reg("COM2141", "core", "theory");
reg("COM221β", "core", "practical");
reg("COM222β", "core", "theory");
// Level 3 – Semester 1
reg("COM311β", "core", "theory");
reg("COM312β", "optional", "combined");
reg("COM3b3β", "core", "practical");
reg("COM3b52", "optional", "combined");
// Level 3 – Semester 2 (all optional for Physical streams)
reg("COM3252", "optional", "theory");
reg("COM3212", "optional", "theory");
reg("COM323α", "optional", "combined");
reg("COM324α", "optional", "combined");
reg("COM326β", "optional", "combined");

// ═══════════════════════════════════════════════════════════════════════════
// MATHEMATICS – B.Sc. General  (Chapter 8)
// Core for Physical Science streams that include Mathematics
// ═══════════════════════════════════════════════════════════════════════════

// Level 1
reg("MAT111β", "core", "theory");
reg("MAT112δ", "core", "theory"); // also used in BCS
reg("MAT113δ", "core", "theory"); // also used in BCS
reg("MAT121β", "core", "theory");
reg("MAT122β", "core", "theory");
// Level 2
reg("MAT211β", "core", "theory");
reg("MAT212β", "core", "theory");
reg("MAT221β", "core", "theory");
reg("MAT222δ", "core", "theory");
reg("MAT224δ", "core", "theory");
reg("MAT225β", "core", "theory");
// Level 3 – Semester 1
reg("MAT311β", "core", "theory");
reg("MAT312β", "core", "theory"); // one-of options
reg("MAT313β", "core", "theory");
// Level 3 – Semester 2 (all optional)
reg("MAT321β", "optional", "theory");
reg("MAT322β", "optional", "theory");
reg("MAT323β", "optional", "theory");
reg("MAT324β", "optional", "theory");
reg("MAT325β", "optional", "theory");
reg("MAT326β", "optional", "theory");

// Bio-stream mathematics
reg("MAT1142", "core", "theory");

// ═══════════════════════════════════════════════════════════════════════════
// INDUSTRIAL MATHEMATICS (IMT)  (Chapter 8)
// ═══════════════════════════════════════════════════════════════════════════
reg("IMT111β", "core", "theory");
reg("IMT121β", "core", "theory");
reg("IMT122β", "core", "theory");
reg("IMT1b2β", "core", "project");
reg("IMT211β", "core", "theory");
reg("IMT2b2β", "core", "project");
reg("IMT221β", "core", "theory");
reg("IMT223β", "core", "theory"); // one-of options
reg("IMT224β", "core", "theory");
reg("IMT3b1β", "core", "project");
reg("IMT312β", "core", "theory"); // one-of options
reg("IMT313β", "core", "theory");
// Semester 2 optional
reg("IMT321β", "optional", "theory");
reg("IMT322β", "optional", "theory");
reg("IMT323β", "optional", "theory");
reg("IMT324β", "optional", "theory");

// ═══════════════════════════════════════════════════════════════════════════
// APPLIED MATHEMATICS (AMT)  (Chapter 8)
// ═══════════════════════════════════════════════════════════════════════════
reg("AMT111β", "core", "theory");
reg("AMT112β", "core", "theory");
reg("AMT121β", "core", "theory");
reg("AMT122β", "core", "theory");
reg("AMT211β", "core", "theory");
reg("AMT212β", "core", "theory");
reg("AMT221β", "core", "theory");
reg("AMT223β", "core", "theory"); // one-of options
reg("AMT224β", "core", "theory");
reg("AMT311β", "core", "theory");
reg("AMT312β", "core", "theory"); // one-of options
reg("AMT313β", "core", "theory");
reg("AMT314β", "core", "theory");
// Semester 2 optional
reg("AMT321β", "optional", "theory");
reg("AMT322β", "optional", "theory");
reg("AMT323β", "optional", "theory");
reg("AMT324β", "optional", "theory");

// ═══════════════════════════════════════════════════════════════════════════
// MATHEMATICS – B.Sc. Honours  (Chapter 8)
// ═══════════════════════════════════════════════════════════════════════════
reg("MAT411β", "core", "theory");
reg("MAT412β", "core", "theory");
reg("MAT413β", "core", "theory");
reg("MAT414β", "core", "theory");
reg("MAT415β", "core", "theory");
reg("MAT421β", "core", "theory");
reg("MAT422β", "core", "theory");
reg("MAT423β", "core", "theory");
reg("MAT424β", "core", "theory");
reg("MAT425β", "core", "theory");
reg("MAT4b6β", "core", "project");
reg("AMT411β", "core", "theory");
reg("AMT412β", "core", "theory");
reg("AMT413β", "core", "theory");
reg("AMT421β", "core", "theory");
reg("AMT422β", "core", "theory");
reg("AMT423β", "core", "theory");
reg("AMT4b6β", "core", "project");

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS – B.Sc. General  (Chapter 9)
// Core for streams that include Physics
// ═══════════════════════════════════════════════════════════════════════════

// Level 1
reg("PHY1114", "core", "theory");
reg("PHY1b22", "core", "practical");
reg("PHY1214", "core", "theory");
// Level 2
reg("PHY2114", "core", "theory");
reg("PHY2b22", "core", "practical");
reg("PHY2214", "core", "theory");
reg("PHY2222", "optional", "practical");
// Level 3 – Semester 1 (core for Physics streams)
reg("PHY3114", "core", "theory");
reg("PHY3121", "core", "practical");
// Level 3 – Semester 2 (all optional)
reg("PHY3232", "optional", "theory");
reg("PHY3242", "optional", "combined");
reg("PHY3252", "optional", "theory");
reg("PHY3262", "optional", "theory");
reg("PHY3272", "optional", "combined");
reg("PHY3282", "optional", "combined");

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS – B.Sc. Honours  (Chapter 9)
// ═══════════════════════════════════════════════════════════════════════════
reg("PHY4112", "core", "theory");
reg("PHY4122", "core", "theory");
reg("PHY4132", "core", "theory");
reg("PHY4142", "core", "theory");
reg("PHY4152", "core", "theory");
reg("PHY4162", "core", "practical");
reg("PHY4172", "core", "theory");
reg("PHY4182", "core", "theory");
reg("PHY4192", "core", "theory");
reg("PHY4202", "core", "combined");
reg("PHY4212", "core", "theory");
reg("PHY4222", "core", "theory");
reg("PHY4232", "core", "practical");
reg("PHY4046", "core", "project");

// ═══════════════════════════════════════════════════════════════════════════
// ZOOLOGY – B.Sc. General  (Chapter 10)
// Core for Bio streams that include Zoology
// ═══════════════════════════════════════════════════════════════════════════

// Level 1 – Semester 1
reg("ZOO1102", "core", "theory");
reg("ZOO1112", "core", "theory");
reg("ZOO1121", "core", "practical");
// Level 1 – Semester 2
reg("ZOO1202", "core", "theory");
reg("ZOO1212", "core", "theory");
reg("ZOO1221", "core", "practical");
// Level 2 – Semester 1
reg("ZOO2102", "core", "theory");
reg("ZOO2112", "core", "theory");
reg("ZOO2121", "core", "practical");
// Level 2 – Semester 2
reg("ZOO2202", "core", "theory");
reg("ZOO2212", "core", "theory");
reg("ZOO2221", "core", "practical");
// Level 2 optional
reg("ZOO2232", "optional", "combined");
reg("ZOO2142", "optional", "combined");
reg("ZOO2152", "optional", "combined");
reg("ZOO2262", "optional", "combined");
// Level 3 – Semester 1 (optional)
reg("ZOO3112", "optional", "combined");
reg("ZOO3122", "optional", "combined");
reg("ZOO3133", "optional", "combined");
reg("ZOO3152", "optional", "combined");
reg("ZOO3162", "optional", "combined");
reg("ZOO3172", "optional", "combined");
reg("ZOO3182", "optional", "combined");
reg("ZOO3192", "optional", "combined");
// Level 3 – Semester 2 (optional)
reg("ZOO3202", "optional", "combined");
reg("ZOO3211", "optional", "theory");
reg("ZOO3223", "optional", "combined");
reg("ZOO3232", "optional", "combined");
reg("ZOO3252", "optional", "combined");
reg("ZOO3272", "optional", "combined");
reg("ZOO3292", "optional", "combined");

// ═══════════════════════════════════════════════════════════════════════════
// ZOOLOGY – B.Sc. Honours  (Chapter 10)
// ═══════════════════════════════════════════════════════════════════════════
reg("ZOO4012", "core", "combined");
reg("ZOO4022", "core", "combined");
reg("ZOO4032", "core", "combined");
reg("ZOO4042", "core", "combined");
reg("ZOO4052", "core", "combined");
reg("ZOO4062", "core", "combined");
reg("ZOO4072", "core", "combined");
reg("ZOO4082", "core", "combined");
reg("ZOO4092", "core", "combined");
reg("ZOO4102", "core", "combined");
reg("ZOO4112", "core", "practical");
reg("ZOO4122", "core", "practical");
reg("ZOO4132", "core", "combined");
reg("ZOO4046", "core", "project");

// ═══════════════════════════════════════════════════════════════════════════
// ICT COURSES  (common across streams)
// ═══════════════════════════════════════════════════════════════════════════
reg("ICT1b13", "core", "combined");
reg("ICT2b13", "optional", "combined");

// ═══════════════════════════════════════════════════════════════════════════
// FSC COURSES  (Chapter 11 – all optional interdisciplinary)
// ═══════════════════════════════════════════════════════════════════════════
reg("FSC115α", "optional", "practical");
reg("FSC215α", "optional", "practical");
reg("FSC224α", "optional", "combined");
reg("FSC225α", "optional", "combined"); // Health related Physical Fitness and Wellness
reg("FSC3112", "optional", "theory");
reg("FSC3122", "optional", "theory");
reg("FSC3132", "optional", "combined");
reg("FSC3bP2", "optional", "practical");
reg("FSC3212", "optional", "theory");
reg("FSC3222", "optional", "combined");
reg("FSC3232", "optional", "theory");

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH COURSES  (DELT)
// ═══════════════════════════════════════════════════════════════════════════
reg("ENG1b10", "core", "theory");
reg("ENG2b10", "core", "theory");
reg("ENG3b10", "core", "theory");

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up the classification of a course by its code.
 * Returns `undefined` if the code is not in the handbook dataset.
 */
export function getCourseClassification(
    code: string
): { type: CourseType; nature: CourseNature } | undefined {
    return COURSE_MAP.get(n(code));
}

/** Is the course classified as core (compulsory)? Defaults to false if unknown. */
export function isCoreCourse(code: string): boolean {
    return COURSE_MAP.get(n(code))?.type === "core";
}

/** Is the course classified as optional? Defaults to false if unknown. */
export function isOptionalCourse(code: string): boolean {
    return COURSE_MAP.get(n(code))?.type === "optional";
}

/** Is the course a pure theory course? */
export function isTheoryCourse(code: string): boolean {
    return COURSE_MAP.get(n(code))?.nature === "theory";
}

/** Is the course a pure practical course? */
export function isPracticalCourse(code: string): boolean {
    return COURSE_MAP.get(n(code))?.nature === "practical";
}

/** Is the course a combined (theory + practical) course? */
export function isCombinedCourse(code: string): boolean {
    return COURSE_MAP.get(n(code))?.nature === "combined";
}

/** Is the course a project course? */
export function isProjectCourse(code: string): boolean {
    return COURSE_MAP.get(n(code))?.nature === "project";
}

/** Check if any classification data exists for the given code */
export function isKnownCourse(code: string): boolean {
    return COURSE_MAP.has(n(code));
}

/**
 * For theory/practical requirement checks:
 * "Theory" = pure theory courses
 * "Practical" = pure practical + combined + project (anything with a practical component)
 */
export function hasTheoryComponent(code: string): boolean {
    const cls = COURSE_MAP.get(n(code));
    if (!cls) return false;
    return cls.nature === "theory" || cls.nature === "combined";
}

export function hasPracticalComponent(code: string): boolean {
    const cls = COURSE_MAP.get(n(code));
    if (!cls) return false;
    return cls.nature === "practical" || cls.nature === "combined" || cls.nature === "project";
}

/** Total number of classified courses in the dataset */
export const TOTAL_CLASSIFIED_COURSES = COURSE_MAP.size;
