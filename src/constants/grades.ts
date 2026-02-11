/**
 * Grade-to-grade-point mapping used for display (progress bars, values).
 * Actual GPA calculation is done server-side.
 */
export const GRADE_SCALE: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
  "E*": 0.0,
  "E+": 0.0,
  "E-": 0.0,
  F: 0.0,
  MC: 0.0,
};

/** All valid grade strings. */
export const GRADE_OPTIONS = Object.keys(GRADE_SCALE);

/** GPA labels to display in the results grid. */
export const GPA_LABELS: Record<string, string> = {
  gpa: "Overall GPA",
  mathGpa: "Math GPA",
  cheGpa: "Chemistry GPA",
  phyGpa: "Physics GPA",
  zooGpa: "Zoology GPA",
  botGpa: "Botany GPA",
  csGpa: "Computer Science GPA",
};
