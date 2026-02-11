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

/** Degree class cutoffs (University of Ruhuna, Faculty of Science). */
export const CLASS_CUTOFFS = [
  { min: 3.7, label: "First Class Honours", color: "emerald" },
  { min: 3.3, label: "Second Class Upper Division", color: "blue" },
  { min: 3.0, label: "Second Class Lower Division", color: "amber" },
  { min: 2.0, label: "Pass", color: "orange" },
] as const;

/** Credit targets by degree type. */
export const DEGREE_CREDIT_TARGETS = [
  { label: "3-Year Degree", credits: 90 },
  { label: "4-Year Degree", credits: 120 },
] as const;

/** Ordered grade list for distribution chart (best to worst). */
export const GRADE_ORDER = [
  "A+", "A", "A-", "B+", "B", "B-",
  "C+", "C", "C-", "D+", "D",
  "E", "E*", "E+", "E-", "F", "MC",
] as const;
