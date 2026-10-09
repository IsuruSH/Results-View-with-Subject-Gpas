import type { SubjectBreakdownRow } from "../types";

/**
 * Series building for the GPA trend chart.
 *
 * Two granularities are offered. The level series is the familiar three
 * figures; the semester series splits each level into its two semesters,
 * which is where the actual story usually is — a level GPA of 2.00 can hide
 * a 1.40 semester followed by a 2.60 one, and that difference is what tells
 * a student whether they are recovering.
 *
 * Each point also carries a **cumulative** GPA: the running weighted average
 * of every credit earned up to and including that point. The two together
 * answer different questions — the per-period line says "how did that
 * semester go", the cumulative line says "where does my degree stand". The
 * final cumulative value equals the overall GPA.
 *
 * Everything is derived on the client from `subjectBreakdown`, which already
 * carries per-subject `year`, `semester`, `credit` and `weightedPoints`, so
 * no extra request is needed.
 */

export interface TrendPoint {
  /** Axis label, e.g. "L2·S1". */
  label: string;
  /** Longer form for the tooltip, e.g. "Level 2, Semester 1". */
  title: string;
  /** GPA for this period alone. */
  value: number;
  credits: number;
  /**
   * Running GPA across every period up to and including this one, or null
   * when per-period credits are unknown (the levelGpas-only fallback).
   */
  cumulative: number | null;
}

export type TrendMode = "level" | "semester";

interface Bucket {
  year: number;
  semester: string;
  credits: number;
  points: number;
}

/**
 * Semester is the second character after the code's letter prefix, so it is
 * usually "1" or "2" but can be a letter (ENG1B10 is a bridging unit in
 * semester "B"). Those normally carry no credits, so they drop out — but the
 * sort has to tolerate them, hence the string comparison.
 */
function compareBuckets(a: Bucket, b: Bucket): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.semester.localeCompare(b.semester);
}

function semesterLabel(semester: string): string {
  return /^\d+$/.test(semester) ? `S${semester}` : semester;
}

/** Walk the series in order, accumulating credits and grade points. */
function attachCumulative(
  buckets: Bucket[],
  toLabel: (b: Bucket) => string,
  toTitle: (b: Bucket) => string
): TrendPoint[] {
  let runningCredits = 0;
  let runningPoints = 0;

  return buckets.map((b) => {
    runningCredits += b.credits;
    runningPoints += b.points;
    return {
      label: toLabel(b),
      title: toTitle(b),
      value: b.points / b.credits,
      credits: b.credits,
      cumulative: runningCredits > 0 ? runningPoints / runningCredits : null,
    };
  });
}

/** Group credit-bearing rows into buckets, keyed by level or level+semester. */
function bucketRows(
  rows: SubjectBreakdownRow[],
  bySemester: boolean
): Bucket[] {
  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    if (!row.year || row.credit <= 0) continue;
    const semester = bySemester ? String(row.semester ?? "") : "";
    const key = `${row.year}-${semester}`;
    const bucket = buckets.get(key) ?? {
      year: row.year,
      semester,
      credits: 0,
      points: 0,
    };
    bucket.credits += row.credit;
    bucket.points += row.weightedPoints;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].filter((b) => b.credits > 0).sort(compareBuckets);
}

/** One point per (level, semester) bucket that carries credit. */
export function buildSemesterSeries(
  rows: SubjectBreakdownRow[] | undefined
): TrendPoint[] {
  if (!rows || rows.length === 0) return [];
  return attachCumulative(
    bucketRows(rows, true),
    (b) => `L${b.year}·${semesterLabel(b.semester)}`,
    (b) => `Level ${b.year}, Semester ${b.semester} · ${b.credits} credits`
  );
}

/** One point per level, derived from the same rows so credits are known. */
export function buildLevelSeriesFromBreakdown(
  rows: SubjectBreakdownRow[] | undefined
): TrendPoint[] {
  if (!rows || rows.length === 0) return [];
  return attachCumulative(
    bucketRows(rows, false),
    (b) => `L${b.year}`,
    (b) => `Level ${b.year} · ${b.credits} credits`
  );
}

/**
 * Fallback for when `subjectBreakdown` is unavailable: the three GPAs the
 * server reports. It does not report per-level credits, so no cumulative
 * line can be drawn from this.
 */
export function buildLevelSeries(
  levelGpas: { level1?: string; level2?: string; level3?: string } | undefined
): TrendPoint[] {
  if (!levelGpas) return [];

  return ([1, 2, 3] as const)
    .map((n) => {
      const raw = levelGpas[`level${n}` as keyof typeof levelGpas];
      const value = parseFloat(raw ?? "");
      return isNaN(value)
        ? null
        : {
            label: `L${n}`,
            title: `Level ${n}`,
            value,
            credits: 0,
            cumulative: null,
          };
    })
    .filter((p): p is TrendPoint => p !== null);
}
