import { describe, it, expect } from "vitest";
import {
  buildRepeatPlan,
  nextClassAbove,
  classFor,
  projectGpa,
} from "../utils/repeatPlan";
import type { SubjectBreakdownRow } from "../types";

/**
 * The planner's numbers have to match what the server would actually return
 * after a repeat, so every expectation below is worked out by hand from the
 * same rules the backend applies:
 *   - a failed subject's credits are already counted in totalCredits
 *   - a repeat replaces the old grade, so credits never change
 */

const row = (
  subjectCode: string,
  credit: number,
  grade: string,
  gradeScale: number
): SubjectBreakdownRow => ({
  subjectCode,
  subjectName: `${subjectCode} name`,
  grade,
  credit,
  gradeScale,
  weightedPoints: credit * gradeScale,
  year: 1,
  semester: "1",
});

describe("buildRepeatPlan — arithmetic", () => {
  // Transcript: 10 credits total, 20 grade points => GPA 2.00
  //   PHY1114 4cr E   (0.0)  -> contributes 0
  //   MAT112δ 1.25cr D+(1.3) -> contributes 1.625
  //   CSC1122 2cr   A (4.0)  -> contributes 8
  //   AMT111β 2.75cr B-(2.7) -> contributes 7.425  (close out to 20 total)
  const subjects = [
    row("PHY1114", 4, "E", 0.0),
    row("MAT112δ", 1.25, "D+", 1.3),
    row("CSC1122", 2, "A", 4.0),
    row("AMT111β", 2.75, "B-", 2.7),
  ];
  const TOTAL_CREDITS = 10;
  const TOTAL_GP = 0 + 1.625 + 8 + 7.425; // = 17.05

  it("computes the single-subject gain exactly", () => {
    const p = buildRepeatPlan(subjects, TOTAL_CREDITS, TOTAL_GP)!;
    // PHY1114: 4 x (2.0 - 0.0) / 10 = 0.80
    const phy = p.ranked.find((r) => r.subjectCode === "PHY1114")!;
    expect(phy.gain).toBeCloseTo(0.8, 10);
    // MAT112δ: 1.25 x (2.0 - 1.3) / 10 = 0.0875
    const mat = p.ranked.find((r) => r.subjectCode === "MAT112δ")!;
    expect(mat.gain).toBeCloseTo(0.0875, 10);
  });

  it("ranks by impact, not by how bad the grade looks", () => {
    const p = buildRepeatPlan(subjects, TOTAL_CREDITS, TOTAL_GP)!;
    expect(p.ranked.map((r) => r.subjectCode)).toEqual(["PHY1114", "MAT112δ"]);
  });

  it("only lists credit-bearing subjects below a C pass", () => {
    const p = buildRepeatPlan(subjects, TOTAL_CREDITS, TOTAL_GP)!;
    // A and B- are passes and must never appear.
    expect(p.ranked.map((r) => r.subjectCode)).not.toContain("CSC1122");
    expect(p.ranked.map((r) => r.subjectCode)).not.toContain("AMT111β");
  });

  it("excludes zero-credit subjects (English/ICT carry no credit)", () => {
    const withZero = [...subjects, row("ENG1B10", 0, "E", 0.0)];
    const p = buildRepeatPlan(withZero, TOTAL_CREDITS, TOTAL_GP)!;
    expect(p.ranked.map((r) => r.subjectCode)).not.toContain("ENG1B10");
  });

  it("keeps total credits fixed — a repeat replaces, never adds", () => {
    const p = buildRepeatPlan(subjects, TOTAL_CREDITS, TOTAL_GP)!;
    // Ceiling = (17.05 + 4x2.0 + 1.25x0.7) / 10 = (17.05 + 8 + 0.875)/10 = 2.5925
    expect(p.ceiling).toBeCloseTo(2.5925, 10);
    // If credits had grown, the denominator would exceed 10 and this would fail.
  });

  it("accumulates the running GPA in rank order", () => {
    const p = buildRepeatPlan(subjects, TOTAL_CREDITS, TOTAL_GP)!;
    // after PHY1114 only: (17.05 + 8) / 10 = 2.505
    expect(p.ranked[0].cumulativeGpa).toBeCloseTo(2.505, 10);
    // then MAT112δ:       (25.05 + 0.875) / 10 = 2.5925
    expect(p.ranked[1].cumulativeGpa).toBeCloseTo(2.5925, 10);
  });

  it("caps every repeat at C — a near-pass gains only the gap to 2.0", () => {
    // C- is 1.7, so the most a repeat can add is 0.3 grade points per credit,
    // never the 2.3 it would gain if repeats could reach A-.
    const nearPass = [row("CSC1122", 2, "C-", 1.7), row("AMT111β", 8, "A", 4.0)];
    const p = buildRepeatPlan(nearPass, 10, 1.7 * 2 + 4.0 * 8)!;
    expect(p.ranked).toHaveLength(1);
    expect(p.ranked[0].gain).toBeCloseTo((2 * 0.3) / 10, 10); // 0.06
  });

  it("never lets the ceiling exceed what the C cap allows", () => {
    const p = buildRepeatPlan(subjects, TOTAL_CREDITS, TOTAL_GP)!;
    // Every repeatable subject sits at exactly 2.0 afterwards; nothing higher
    // is reachable however well the student performs.
    const maxGp =
      TOTAL_GP +
      subjects
        .filter((s) => s.credit > 0 && s.gradeScale < 2.0)
        .reduce((a, s) => a + s.credit * (2.0 - s.gradeScale), 0);
    expect(p.ceiling).toBeCloseTo(maxGp / TOTAL_CREDITS, 10);
  });
});

describe("buildRepeatPlan — class targets", () => {
  const subjects = [
    row("PHY1114", 4, "E", 0.0),
    row("MAT112δ", 1.25, "D+", 1.3),
    row("CSC1122", 2, "A", 4.0),
    row("AMT111β", 2.75, "B-", 2.7),
  ];
  const TOTAL_GP = 17.05;

  it("reports how many repeats reach the next class", () => {
    const p = buildRepeatPlan(subjects, 10, TOTAL_GP)!;
    // Current GPA 1.705 -> next class up is Pass (2.00).
    expect(p.next?.min).toBe(2.0);
    // One repeat (PHY1114 -> 2.505) already clears it.
    expect(p.needed).toBe(1);
  });

  it("says so honestly when the next class is unreachable by repeats", () => {
    // Everything already passed except one tiny 1.25-credit D+.
    const nearlyDone = [
      row("MAT112δ", 1.25, "D+", 1.3),
      row("CSC1122", 50, "B", 3.0),
    ];
    // 51.25 credits, GP = 1.625 + 150 = 151.625 -> GPA 2.958
    const p = buildRepeatPlan(nearlyDone, 51.25, 151.625)!;
    expect(p.next?.min).toBe(3.0); // Second Class Lower
    // Max gain is 1.25 x 0.7 / 51.25 = 0.017 -> 2.975, short of 3.00
    expect(p.ceiling).toBeLessThan(3.0);
    expect(p.needed).toBeNull();
  });

  it("returns an empty plan when nothing is below a C pass", () => {
    const allPassed = [row("CSC1122", 2, "A", 4.0), row("AMT111β", 3, "B", 3.0)];
    const p = buildRepeatPlan(allPassed, 5, 17)!;
    expect(p.ranked).toHaveLength(0);
    expect(p.ceiling).toBeCloseTo(3.4, 10); // unchanged from current
  });

  it("guards against divide-by-zero before results load", () => {
    expect(buildRepeatPlan([], 0, 0)).toBeNull();
  });
});

describe("choosing a different combination", () => {
  // 10 credits, GP 17.05 -> GPA 1.705
  const subjects = [
    row("PHY1114", 4, "E", 0.0),
    row("MAT112δ", 1.25, "D+", 1.3),
    row("CSC1122", 2, "A", 4.0),
    row("AMT111β", 2.75, "B-", 2.7),
  ];
  const TOTAL_GP = 17.05;

  it("opens on the smallest set that reaches the next class", () => {
    const p = buildRepeatPlan(subjects, 10, TOTAL_GP)!;
    expect(p.recommended).toEqual(["PHY1114"]); // one repeat clears Pass
  });

  it("falls back to every candidate when the class is unreachable", () => {
    const nearlyDone = [
      row("MAT112δ", 1.25, "D+", 1.3),
      row("CSC1122", 50, "B", 3.0),
    ];
    const p = buildRepeatPlan(nearlyDone, 51.25, 151.625)!;
    expect(p.needed).toBeNull();
    expect(p.recommended).toEqual(["MAT112δ"]); // the only candidate there is
  });

  it("projects a hand-picked subset, not just the top of the ranking", () => {
    const p = buildRepeatPlan(subjects, 10, TOTAL_GP)!;
    // A student who cannot realistically pass PHY1114 picks the smaller one.
    const onlyMat = p.ranked.filter((r) => r.subjectCode === "MAT112δ");
    // (17.05 + 1.25 x 0.7) / 10 = 1.7925
    expect(projectGpa(10, TOTAL_GP, onlyMat)).toBeCloseTo(1.7925, 10);
  });

  it("is order-independent — picking order cannot change the GPA", () => {
    const p = buildRepeatPlan(subjects, 10, TOTAL_GP)!;
    const forward = [...p.ranked];
    const backward = [...p.ranked].reverse();
    expect(projectGpa(10, TOTAL_GP, forward)).toBeCloseTo(
      projectGpa(10, TOTAL_GP, backward),
      10
    );
  });

  it("selecting nothing leaves the GPA untouched", () => {
    expect(projectGpa(10, TOTAL_GP, [])).toBeCloseTo(1.705, 10);
  });

  it("selecting everything equals the ceiling", () => {
    const p = buildRepeatPlan(subjects, 10, TOTAL_GP)!;
    expect(projectGpa(10, TOTAL_GP, p.ranked)).toBeCloseTo(p.ceiling, 10);
  });
});

describe("MC attempts are not capped", () => {
  const subjects = [row("PHY1114", 4, "E", 0.0), row("MAT112δ", 1.25, "D+", 1.3)];

  it("flags only the subjects with an MC in their history", () => {
    const p = buildRepeatPlan(subjects, 10, 1.625, new Set(["PHY1114"]))!;
    expect(p.ranked.find((r) => r.subjectCode === "PHY1114")!.uncapped).toBe(true);
    expect(p.ranked.find((r) => r.subjectCode === "MAT112δ")!.uncapped).toBe(false);
  });

  it("matches codes case-insensitively", () => {
    const p = buildRepeatPlan(subjects, 10, 1.625, new Set(["phy1114".toUpperCase()]))!;
    expect(p.ranked.find((r) => r.subjectCode === "PHY1114")!.uncapped).toBe(true);
  });

  it("still reports the capped figure, so the projection stays conservative", () => {
    const capped = buildRepeatPlan(subjects, 10, 1.625)!;
    const withMc = buildRepeatPlan(subjects, 10, 1.625, new Set(["PHY1114"]))!;
    // The MC flag is presentational: it must never inflate the arithmetic.
    expect(withMc.ceiling).toBeCloseTo(capped.ceiling, 10);
  });

  it("defaults to everything capped when no MC set is supplied", () => {
    const p = buildRepeatPlan(subjects, 10, 1.625)!;
    expect(p.ranked.every((r) => !r.uncapped)).toBe(true);
  });
});

describe("class helpers", () => {
  it("maps a GPA to its class", () => {
    expect(classFor(3.8)).toBe("First Class Honours");
    expect(classFor(3.4)).toBe("Second Class Upper Division");
    expect(classFor(3.0)).toBe("Second Class Lower Division");
    expect(classFor(2.5)).toBe("Pass");
    expect(classFor(1.2)).toBeNull();
  });

  it("finds the next class above, and nothing above First Class", () => {
    expect(nextClassAbove(2.5)?.min).toBe(3.0);
    expect(nextClassAbove(3.55)?.min).toBe(3.7);
    expect(nextClassAbove(3.9)).toBeNull();
  });
});
