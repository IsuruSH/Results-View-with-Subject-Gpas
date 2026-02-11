import { useState, useMemo } from "react";
import { Target } from "lucide-react";
import { GRADE_SCALE, CLASS_CUTOFFS, DEGREE_CREDIT_TARGETS } from "../../constants/grades";

interface GpaTargetPlannerProps {
  totalCredits: number | undefined;
  totalGradePoints: number | undefined;
}

function closestGrade(gradePoint: number): string {
  let closest = "A+";
  let minDiff = Infinity;
  for (const [grade, value] of Object.entries(GRADE_SCALE)) {
    if (grade === "MC") continue;
    const diff = Math.abs(value - gradePoint);
    if (diff < minDiff) {
      minDiff = diff;
      closest = grade;
    }
  }
  return closest;
}

export default function GpaTargetPlanner({
  totalCredits,
  totalGradePoints,
}: GpaTargetPlannerProps) {
  const currentCredits = totalCredits ?? 0;
  const currentGP = totalGradePoints ?? 0;
  const [targetGpa, setTargetGpa] = useState("3.70");
  const [degreeIdx, setDegreeIdx] = useState(0);

  const degreeCredits = DEGREE_CREDIT_TARGETS[degreeIdx].credits;
  const remainingCredits = Math.max(degreeCredits - currentCredits, 0);

  const result = useMemo(() => {
    const target = parseFloat(targetGpa);
    if (isNaN(target) || remainingCredits <= 0) return null;

    const totalNeeded = target * (currentCredits + remainingCredits);
    const needed = totalNeeded - currentGP;
    const requiredAvg = needed / remainingCredits;

    if (requiredAvg > 4.0) {
      return { impossible: true, requiredAvg, grade: "A+" };
    }
    if (requiredAvg < 0) {
      return { alreadyAchieved: true, requiredAvg: 0, grade: "" };
    }

    return {
      impossible: false,
      alreadyAchieved: false,
      requiredAvg,
      grade: closestGrade(requiredAvg),
    };
  }, [targetGpa, remainingCredits, currentCredits, currentGP]);

  if (currentCredits === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Target GPA */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Target GPA
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="2.00"
              max="4.00"
              step="0.05"
              value={targetGpa}
              onChange={(e) => setTargetGpa(e.target.value)}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-12 text-center text-sm font-bold text-indigo-600">
              {parseFloat(targetGpa).toFixed(2)}
            </span>
          </div>
          {/* Quick buttons for class cutoffs */}
          <div className="flex gap-1.5 mt-2">
            {CLASS_CUTOFFS.map((c) => (
              <button
                key={c.min}
                onClick={() => setTargetGpa(c.min.toFixed(2))}
                className={`px-2 py-0.5 text-[10px] rounded-full font-medium transition-colors ${
                  parseFloat(targetGpa) === c.min
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {c.min.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {/* Degree type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Degree Program
          </label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {DEGREE_CREDIT_TARGETS.map((dt, idx) => (
              <button
                key={dt.label}
                onClick={() => setDegreeIdx(idx)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  degreeIdx === idx
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {remainingCredits} credits remaining
          </p>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg p-4 text-center ${
            result.impossible
              ? "bg-red-50"
              : result.alreadyAchieved
              ? "bg-emerald-50"
              : "bg-indigo-50"
          }`}
        >
          {result.impossible ? (
            <>
              <p className="text-sm font-semibold text-red-700">
                Not achievable
              </p>
              <p className="text-xs text-red-500 mt-1">
                This target requires an average of {result.requiredAvg.toFixed(2)} per
                credit, which exceeds the maximum 4.00
              </p>
            </>
          ) : result.alreadyAchieved ? (
            <>
              <p className="text-sm font-semibold text-emerald-700">
                Already achieved!
              </p>
              <p className="text-xs text-emerald-500 mt-1">
                Your current GPA already meets this target
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-indigo-500">
                You need an average grade of
              </p>
              <p className="text-2xl font-bold text-indigo-700 my-1">
                {result.grade}{" "}
                <span className="text-sm font-normal">
                  ({result.requiredAvg.toFixed(2)})
                </span>
              </p>
              <p className="text-xs text-indigo-500">
                across your remaining {remainingCredits} credits
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
