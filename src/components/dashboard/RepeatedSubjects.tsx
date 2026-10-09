import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { GRADE_OPTIONS, GRADE_SCALE } from "../../constants/grades";
import type { RepeatedSubject } from "../../types";

/**
 * A repeat is capped at grade C (2.00) — however well the student performs,
 * the recorded grade cannot exceed it.
 *
 * The exception is an approved MC (medical certificate): that sitting counts
 * as a first attempt rather than a repeat, so no cap applies and every grade
 * stays selectable. Offering A+ on a genuinely capped subject would let a
 * student calculate a GPA the regulations cannot produce.
 */
const REPEAT_CAP_VALUE = GRADE_SCALE["C"];

const CAPPED_GRADE_OPTIONS = GRADE_OPTIONS.filter(
  (g) => (GRADE_SCALE[g] ?? 0) <= REPEAT_CAP_VALUE
);

function hasMcAttempt(subject: RepeatedSubject): boolean {
  return subject.attempts?.some((a) => a.grade === "MC") ?? false;
}

interface RepeatedSubjectsProps {
  repeatedSubjects: RepeatedSubject[];
  editableGrades: Record<string, string>;
  includeRepeated: boolean;
  onGradeChange: (subjectCode: string, grade: string) => void;
  onIncludeChange: (value: boolean) => void;
}

export default function RepeatedSubjects({
  repeatedSubjects,
  editableGrades,
  includeRepeated,
  onGradeChange,
  onIncludeChange,
}: RepeatedSubjectsProps) {
  if (repeatedSubjects.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Repeated Subjects
          </h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {repeatedSubjects.length}
          </span>
          <span className="hidden sm:inline text-xs text-gray-400">
            grades capped at C, except after an MC
          </span>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={includeRepeated}
            onChange={(e) => onIncludeChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          <span className="ms-2 text-xs text-gray-500">Include</span>
        </label>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {repeatedSubjects.map((subject) => {
          const currentGrade =
            editableGrades[subject.subjectCode] ||
            subject.latestAttempt.grade;
          const gradeValue = GRADE_SCALE[currentGrade] ?? 0;
          const progressPercent = (gradeValue / 4.0) * 100;

          // MC attempts are not capped; everything else stops at C.
          const uncapped = hasMcAttempt(subject);
          const options = uncapped ? GRADE_OPTIONS : CAPPED_GRADE_OPTIONS;
          // A grade carried over from before the cap was applied would vanish
          // from the list and silently reset the <select>; keep it visible.
          const gradeOptions = options.includes(currentGrade)
            ? options
            : [currentGrade, ...options];

          return (
            <div
              key={subject.subjectCode}
              className={`border rounded-lg p-4 transition-all ${
                includeRepeated
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {subject.subjectName}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-mono text-indigo-600">
                      {subject.subjectCode}
                    </span>
                    {uncapped && (
                      <span
                        title="An earlier attempt was an approved MC, so this sitting counts as a first attempt and is not capped at C."
                        className="text-[10px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full"
                      >
                        MC · not capped
                      </span>
                    )}
                  </div>
                </div>
                <select
                  value={currentGrade}
                  onChange={(e) =>
                    onGradeChange(subject.subjectCode, e.target.value)
                  }
                  disabled={!includeRepeated}
                  title={
                    uncapped
                      ? "Not capped — an earlier attempt was an approved MC"
                      : "A repeat cannot be graded above C"
                  }
                  className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attempt pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {subject.attempts.map((attempt, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      attempt.isLowGrade
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {attempt.grade} ({attempt.year})
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor:
                      gradeValue >= 3.5
                        ? "#22c55e"
                        : gradeValue >= 3.0
                        ? "#3b82f6"
                        : gradeValue >= 2.0
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Grade value: {gradeValue.toFixed(1)} / 4.0
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
