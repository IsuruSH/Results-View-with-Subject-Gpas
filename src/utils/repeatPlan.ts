import { GRADE_SCALE, CLASS_CUTOFFS } from "../constants/grades";
import type { SubjectBreakdownRow } from "../types";

/**
 * Pure maths behind the Repeat & Recovery Planner.
 *
 * Repeating is NOT the same as adding a subject, and two properties of the
 * server's GPA engine (res_proxy/src/utils/gpa.js) make the formula exact:
 *
 *   1. `accumulateCredits` adds `credit` to the total regardless of grade and
 *      scores 0 grade points for E/F — so a failed subject's credits are
 *      ALREADY in `totalCredits`, and repeating never changes that total.
 *   2. Attempts are keyed by subject code, so a repeat REPLACES the previous
 *      grade rather than appending a second attempt.
 *
 * Therefore, for a single subject:
 *     ΔGPA = credit × (newGradePoint − oldGradePoint) / totalCredits
 *
 * and for a set of repeats, grade points add while credits stay fixed.
 */

/** A subject is repeatable below a C pass — mirrors the server's own rule. */
export const PASS_THRESHOLD = GRADE_SCALE["C"];

/**
 * Faculty of Science caps a repeat at grade C (2.00) — a repeat can clear the
 * pass threshold but never earn more than 2.0 grade points, however well the
 * student performs.
 *
 * This is a hard regulation, not a preference, so it is deliberately NOT
 * user-adjustable: letting someone model a repeat at B would produce a GPA the
 * rules cannot deliver. It also makes `ceiling` an absolute maximum, so an
 * "out of reach" verdict is a fact rather than a projection.
 */
export const REPEAT_CAP = GRADE_SCALE["C"];

export interface RepeatCandidate extends SubjectBreakdownRow {
  /** GPA gain from repeating this subject alone, at the C cap. */
  gain: number;
  /** GPA after repeating this subject and every higher-ranked one. */
  cumulativeGpa: number;
  /**
   * True when an earlier attempt was an approved MC. That sitting is treated
   * as a first attempt rather than a repeat, so the C cap does not apply and
   * the real upside is higher than `gain` shows.
   */
  uncapped: boolean;
}

export interface RepeatPlan {
  currentGpa: number;
  /** Repeatable subjects, highest GPA impact first. */
  ranked: RepeatCandidate[];
  /**
   * The highest GPA repeats can ever produce — every eligible subject raised
   * to the C cap. Nothing a student does in a repeat can beat this.
   */
  ceiling: number;
  /** The next degree class above the current GPA, if any. */
  next: (typeof CLASS_CUTOFFS)[number] | null;
  /** Fewest repeats that reach `next`, or null when unreachable. */
  needed: number | null;
  /**
   * Subject codes making up the smallest set that reaches the next class —
   * the planner's opening recommendation. Falls back to every candidate when
   * no set can get there, so the student still sees the realistic maximum.
   */
  recommended: string[];
}

/**
 * GPA after repeating exactly `selected` and nothing else.
 *
 * Order-independent, so it stays correct however the student picks and
 * un-picks subjects: credits are fixed, so only the grade points move.
 */
export function projectGpa(
  totalCredits: number,
  totalGradePoints: number,
  selected: Pick<RepeatCandidate, "credit" | "gradeScale">[]
): number {
  if (totalCredits <= 0) return 0;
  const added = selected.reduce(
    (sum, s) => sum + s.credit * (REPEAT_CAP - s.gradeScale),
    0
  );
  return (totalGradePoints + added) / totalCredits;
}

/** The next class up from a GPA, or null when already in the top band. */
export function nextClassAbove(gpa: number) {
  const above = CLASS_CUTOFFS.filter((c) => c.min > gpa);
  return above.length ? above[above.length - 1] : null;
}

/** The class a GPA currently sits in, or null if below every cutoff. */
export function classFor(gpa: number): string | null {
  for (const c of CLASS_CUTOFFS) if (gpa >= c.min) return c.label;
  return null;
}

export function buildRepeatPlan(
  subjectBreakdown: SubjectBreakdownRow[],
  totalCredits: number,
  totalGradePoints: number,
  /** Upper-cased codes with an approved MC in their attempt history. */
  mcCodes: Set<string> = new Set()
): RepeatPlan | null {
  if (totalCredits <= 0) return null;

  const currentGpa = totalGradePoints / totalCredits;

  // Credit-bearing and below a C pass. Because the cap equals the pass
  // threshold, anything already at C or above can neither be repeated nor
  // gain from it.
  const eligible = subjectBreakdown.filter(
    (s) => s.credit > 0 && s.gradeScale < PASS_THRESHOLD
  );

  const ranked = eligible
    .map((s) => ({
      ...s,
      gain: (s.credit * (REPEAT_CAP - s.gradeScale)) / totalCredits,
      cumulativeGpa: 0, // filled in below, once ordered
      uncapped: mcCodes.has(s.subjectCode.toUpperCase()),
    }))
    .sort((a, b) => b.gain - a.gain);

  let runningGp = totalGradePoints;
  for (const s of ranked) {
    runningGp += s.credit * (REPEAT_CAP - s.gradeScale);
    s.cumulativeGpa = runningGp / totalCredits;
  }

  const ceiling = ranked.length
    ? ranked[ranked.length - 1].cumulativeGpa
    : currentGpa;

  const next = nextClassAbove(currentGpa);
  let needed: number | null = null;
  if (next) {
    const idx = ranked.findIndex((c) => c.cumulativeGpa >= next.min);
    needed = idx === -1 ? null : idx + 1;
  }

  // Open on the smallest set that gets there; if nothing does, open on the
  // full set so the student can see the real ceiling straight away.
  const recommended = (needed !== null ? ranked.slice(0, needed) : ranked).map(
    (c) => c.subjectCode
  );

  return { currentGpa, ranked, ceiling, next, needed, recommended };
}
