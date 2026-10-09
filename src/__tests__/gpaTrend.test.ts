import { describe, it, expect } from "vitest";
import {
  buildLevelSeries,
  buildLevelSeriesFromBreakdown,
  buildSemesterSeries,
} from "../utils/gpaTrend";
import type { SubjectBreakdownRow } from "../types";

function row(
  subjectCode: string,
  year: number,
  semester: string,
  credit: number,
  gradeScale: number
): SubjectBreakdownRow {
  return {
    subjectCode,
    subjectName: subjectCode,
    grade: "",
    credit,
    gradeScale,
    weightedPoints: credit * gradeScale,
    year,
    semester,
  };
}

describe("buildLevelSeries", () => {
  it("returns nothing when there are no level GPAs", () => {
    expect(buildLevelSeries(undefined)).toEqual([]);
    expect(buildLevelSeries({})).toEqual([]);
  });

  it("keeps levels in order and skips absent ones", () => {
    const series = buildLevelSeries({ level1: "1.83", level3: "1.95" });
    expect(series.map((p) => p.label)).toEqual(["L1", "L3"]);
    expect(series.map((p) => p.value)).toEqual([1.83, 1.95]);
  });

  it("ignores unparseable values", () => {
    expect(buildLevelSeries({ level1: "", level2: "n/a", level3: "2.5" })).toHaveLength(1);
  });

  it("reports no cumulative, because per-level credits are unknown", () => {
    const series = buildLevelSeries({ level1: "1.83", level2: "2.00" });
    expect(series.every((p) => p.cumulative === null)).toBe(true);
  });
});

describe("buildLevelSeriesFromBreakdown", () => {
  it("collapses semesters into one point per level", () => {
    const series = buildLevelSeriesFromBreakdown([
      row("A", 1, "1", 3, 4.0), // 12
      row("B", 1, "2", 1, 2.0), // 2   -> L1 14/4 = 3.50
      row("C", 2, "1", 2, 1.0), // 2   -> L2 2/2  = 1.00
    ]);
    expect(series.map((p) => p.label)).toEqual(["L1", "L2"]);
    expect(series[0].value).toBeCloseTo(3.5, 10);
    expect(series[0].credits).toBe(4);
    expect(series[1].value).toBeCloseTo(1.0, 10);
  });

  it("carries credits, so a cumulative line is available", () => {
    const series = buildLevelSeriesFromBreakdown([
      row("A", 1, "1", 4, 4.0),
      row("C", 2, "1", 2, 1.0),
    ]);
    // Cumulative after L2: (16 + 2) / 6 = 3.00
    expect(series[1].cumulative).toBeCloseTo(3.0, 10);
  });
});

describe("cumulative GPA", () => {
  it("equals the period GPA at the first point", () => {
    const series = buildSemesterSeries([row("A", 1, "1", 3, 2.4)]);
    expect(series[0].cumulative).toBeCloseTo(series[0].value, 10);
  });

  it("weights by credits, not by period", () => {
    // A big weak semester followed by a tiny strong one: the cumulative must
    // stay near the big one, which a naive mean of GPAs would not do.
    const series = buildSemesterSeries([
      row("A", 1, "1", 20, 1.0),
      row("B", 1, "2", 2, 4.0),
    ]);
    expect(series[1].value).toBeCloseTo(4.0, 10);
    // (20 + 8) / 22 = 1.2727…, not (1.0 + 4.0) / 2 = 2.5
    expect(series[1].cumulative).toBeCloseTo(28 / 22, 10);
  });

  it("rises and falls with each period, ending at the overall GPA", () => {
    const rows = [
      row("A", 1, "1", 4, 3.0), // 12
      row("B", 1, "2", 4, 1.0), // 4
      row("C", 2, "1", 2, 4.0), // 8
    ];
    const series = buildSemesterSeries(rows);
    expect(series.map((p) => p.cumulative!.toFixed(2))).toEqual([
      "3.00", // 12/4
      "2.00", // 16/8
      "2.40", // 24/10
    ]);

    const totalCredits = rows.reduce((s, r) => s + r.credit, 0);
    const totalPoints = rows.reduce((s, r) => s + r.weightedPoints, 0);
    expect(series[series.length - 1].cumulative).toBeCloseTo(
      totalPoints / totalCredits,
      10
    );
  });

  it("is identical at the last point whichever granularity is used", () => {
    const rows = [
      row("A", 1, "1", 3, 2.0),
      row("B", 1, "2", 2, 3.5),
      row("C", 2, "1", 4, 1.5),
    ];
    const bySemester = buildSemesterSeries(rows);
    const byLevel = buildLevelSeriesFromBreakdown(rows);
    expect(bySemester[bySemester.length - 1].cumulative).toBeCloseTo(
      byLevel[byLevel.length - 1].cumulative!,
      10
    );
  });
});

describe("buildSemesterSeries", () => {
  it("returns nothing without rows", () => {
    expect(buildSemesterSeries(undefined)).toEqual([]);
    expect(buildSemesterSeries([])).toEqual([]);
  });

  it("averages each (level, semester) bucket by credit", () => {
    const series = buildSemesterSeries([
      row("CSC1113", 1, "1", 3, 2.0), // 6.0
      row("CSC1122", 1, "1", 2, 4.0), // 8.0  -> 14.0 / 5 = 2.80
      row("CSC1213", 1, "2", 3, 1.0), // 3.0  -> 3.0 / 3 = 1.00
    ]);

    expect(series).toHaveLength(2);
    expect(series[0].label).toBe("L1·S1");
    expect(series[0].value).toBeCloseTo(2.8, 10);
    expect(series[0].credits).toBe(5);
    expect(series[1].label).toBe("L1·S2");
    expect(series[1].value).toBeCloseTo(1.0, 10);
  });

  it("orders by level then semester", () => {
    const series = buildSemesterSeries([
      row("CSC3113", 3, "1", 3, 2.0),
      row("CSC1213", 1, "2", 3, 2.0),
      row("CSC2113", 2, "1", 3, 2.0),
      row("CSC1113", 1, "1", 3, 2.0),
      row("CSC2213", 2, "2", 3, 2.0),
    ]);
    expect(series.map((p) => p.label)).toEqual([
      "L1·S1",
      "L1·S2",
      "L2·S1",
      "L2·S2",
      "L3·S1",
    ]);
  });

  it("drops zero-credit units so they cannot skew a semester", () => {
    // ENG1B10 is a bridging unit: semester "B", zero credits.
    const series = buildSemesterSeries([
      row("CSC1113", 1, "1", 3, 3.0),
      row("ENG1B10", 1, "B", 0, 2.7),
    ]);
    expect(series.map((p) => p.label)).toEqual(["L1·S1"]);
    expect(series[0].value).toBeCloseTo(3.0, 10);
  });

  it("ignores rows with no level", () => {
    expect(buildSemesterSeries([row("XXX0113", 0, "1", 3, 3.0)])).toEqual([]);
  });

  it("keeps a non-numeric semester that does carry credit", () => {
    const series = buildSemesterSeries([row("FSC1B12", 1, "B", 2, 3.0)]);
    expect(series.map((p) => p.label)).toEqual(["L1·B"]);
  });

  it("recombines to the level GPA — sc12419's real level 1", () => {
    // 16.5 credits at 2.06 in S1, 17 credits at 1.61 in S2 -> 1.83 overall.
    const series = buildSemesterSeries([
      row("S1", 1, "1", 16.5, 2.0606060606060606),
      row("S2", 1, "2", 17, 1.611764705882353),
    ]);
    const credits = series.reduce((s, p) => s + p.credits, 0);
    const points = series.reduce((s, p) => s + p.value * p.credits, 0);
    expect((points / credits).toFixed(2)).toBe("1.83");
  });
});
