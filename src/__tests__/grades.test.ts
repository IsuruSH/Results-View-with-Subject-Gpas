import { describe, it, expect } from "vitest";
import { GRADE_SCALE, GRADE_OPTIONS, GPA_LABELS } from "../constants/grades";

describe("GRADE_SCALE", () => {
  it("maps A+ to 4.0", () => {
    expect(GRADE_SCALE["A+"]).toBe(4.0);
  });

  it("maps A to 4.0", () => {
    expect(GRADE_SCALE["A"]).toBe(4.0);
  });

  it("maps B+ to 3.3", () => {
    expect(GRADE_SCALE["B+"]).toBe(3.3);
  });

  it("maps C to 2.0", () => {
    expect(GRADE_SCALE["C"]).toBe(2.0);
  });

  it("maps F to 0.0", () => {
    expect(GRADE_SCALE["F"]).toBe(0.0);
  });

  it("maps MC to 0.0", () => {
    expect(GRADE_SCALE["MC"]).toBe(0.0);
  });

  it("has correct descending order for main grades", () => {
    expect(GRADE_SCALE["A+"]).toBeGreaterThanOrEqual(GRADE_SCALE["A"]);
    expect(GRADE_SCALE["A"]).toBeGreaterThan(GRADE_SCALE["A-"]);
    expect(GRADE_SCALE["A-"]).toBeGreaterThan(GRADE_SCALE["B+"]);
    expect(GRADE_SCALE["B+"]).toBeGreaterThan(GRADE_SCALE["B"]);
    expect(GRADE_SCALE["B"]).toBeGreaterThan(GRADE_SCALE["B-"]);
    expect(GRADE_SCALE["B-"]).toBeGreaterThan(GRADE_SCALE["C+"]);
    expect(GRADE_SCALE["C+"]).toBeGreaterThan(GRADE_SCALE["C"]);
    expect(GRADE_SCALE["C"]).toBeGreaterThan(GRADE_SCALE["C-"]);
    expect(GRADE_SCALE["C-"]).toBeGreaterThan(GRADE_SCALE["D+"]);
    expect(GRADE_SCALE["D+"]).toBeGreaterThan(GRADE_SCALE["D"]);
    expect(GRADE_SCALE["D"]).toBeGreaterThan(GRADE_SCALE["F"]);
  });
});

describe("GRADE_OPTIONS", () => {
  it("contains all grade keys", () => {
    expect(GRADE_OPTIONS).toContain("A+");
    expect(GRADE_OPTIONS).toContain("A");
    expect(GRADE_OPTIONS).toContain("F");
    expect(GRADE_OPTIONS).toContain("MC");
  });

  it("matches GRADE_SCALE keys", () => {
    expect(GRADE_OPTIONS).toEqual(Object.keys(GRADE_SCALE));
  });
});

describe("GPA_LABELS", () => {
  it("has labels for all 7 GPA types", () => {
    expect(Object.keys(GPA_LABELS)).toHaveLength(7);
  });

  it("has correct label for overall GPA", () => {
    expect(GPA_LABELS.gpa).toBe("Overall GPA");
  });

  it("has correct label for CS GPA", () => {
    expect(GPA_LABELS.csGpa).toBe("Computer Science GPA");
  });
});
