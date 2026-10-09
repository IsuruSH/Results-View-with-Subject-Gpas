import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Info, TrendingUp, CheckCircle2 } from "lucide-react";
import { buildRepeatPlan, classFor, projectGpa } from "../../utils/repeatPlan";
import type { RepeatedSubject, SubjectBreakdownRow } from "../../types";

/**
 * Repeat & Recovery Planner
 * ---------------------------------------------------------------------------
 * Ranks the subjects a student may repeat by how much each would actually move
 * the overall GPA, then shows the cheapest route to the next degree class.
 *
 * The arithmetic here is exact rather than an estimate, because repeating does
 * not behave like adding a new subject. Two properties of the server's GPA
 * engine (src/utils/gpa.js) make the formula below exact:
 *
 *   1. Credits are counted even when a subject was failed — `accumulateCredits`
 *      adds `credit` regardless of grade and scores 0 grade points for E/F.
 *      So repeating NEVER changes total credits.
 *   2. Results are keyed by subject code, so a repeat REPLACES the previous
 *      attempt rather than adding a second one.
 *
 * Hence:   ΔGPA = credit × (newGradePoint − oldGradePoint) / totalCredits
 *
 * The one input that is NOT derivable from the data is the grade a student can
 * actually achieve on a repeat. Some Sri Lankan faculties cap it (University of
 * Ruhuna's Faculty of Humanities caps repeats at C = 2.00); no published rule
 * for this faculty could be verified, and neither test transcript contained a
 * repeat attempt to infer it from. So it is an explicit, adjustable assumption
 * shown in the UI, defaulting to the conservative C — never silently baked in.
 */

interface RepeatPlannerProps {
  subjectBreakdown: SubjectBreakdownRow[] | undefined;
  totalCredits: number | undefined;
  totalGradePoints: number | undefined;
  /** Used only to spot subjects with an MC attempt, which are not capped. */
  repeatedSubjects?: RepeatedSubject[];
}

export default function RepeatPlanner({
  subjectBreakdown,
  totalCredits,
  totalGradePoints,
  repeatedSubjects,
}: RepeatPlannerProps) {
  const credits = totalCredits ?? 0;
  const gradePoints = totalGradePoints ?? 0;

  const mcCodes = useMemo(() => {
    const set = new Set<string>();
    for (const s of repeatedSubjects ?? []) {
      if (s.attempts?.some((a) => a.grade === "MC")) {
        set.add(s.subjectCode.toUpperCase());
      }
    }
    return set;
  }, [repeatedSubjects]);

  // All arithmetic lives in utils/repeatPlan.ts so it can be unit-tested.
  // There is no target-grade control: the faculty caps every repeat at C.
  const model = useMemo(
    () =>
      subjectBreakdown
        ? buildRepeatPlan(subjectBreakdown, credits, gradePoints, mcCodes)
        : null,
    [subjectBreakdown, credits, gradePoints, mcCodes]
  );

  // Which subjects the student intends to actually retake. Seeded with the
  // recommendation, then theirs to change — the subject with the biggest
  // number on paper is not always the one they can realistically pass.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const recommendedKey = model?.recommended.join(",") ?? "";
  useEffect(() => {
    setSelected(new Set(model?.recommended ?? []));
  }, [recommendedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const projected = useMemo(() => {
    if (!model) return 0;
    return projectGpa(
      credits,
      gradePoints,
      model.ranked.filter((r) => selected.has(r.subjectCode))
    );
  }, [model, selected, credits, gradePoints]);

  // Nothing to show until results have loaded.
  if (!model || !subjectBreakdown) return null;

  const { ranked, ceiling, next, needed, currentGpa, recommended } = model;

  const toggle = (code: string) =>
    setSelected((prev) => {
      const nextSel = new Set(prev);
      if (nextSel.has(code)) nextSel.delete(code);
      else nextSel.add(code);
      return nextSel;
    });

  const reachesTarget = next ? projected >= next.min : true;
  const isRecommended =
    selected.size === recommended.length &&
    recommended.every((c) => selected.has(c));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* ---- Header ---- */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Repeat &amp; Recovery Planner
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Which repeats actually move your GPA — ranked by real impact
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
          Repeats capped at C (2.00)
        </span>
      </div>

      {ranked.length === 0 ? (
        /* ---- Nothing to repeat ---- */
        <div className="px-5 py-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            No subjects below a C pass
          </p>
          <p className="text-xs text-gray-400 mt-1">
            There is nothing to repeat — every credited subject is already at C
            or above.
          </p>
        </div>
      ) : (
        <>
          {/* ---- Headline verdict ---- */}
          <div className="px-5 py-4 bg-indigo-50/50 border-b border-indigo-100">
            {next ? (
              needed !== null ? (
                <p className="text-sm text-gray-700">
                  Repeating the top{" "}
                  <span className="font-bold text-indigo-700">
                    {needed === 1 ? "subject" : `${needed} subjects`}
                  </span>{" "}
                  below would reach{" "}
                  <span className="font-bold text-indigo-700">{next.label}</span>{" "}
                  ({next.min.toFixed(2)}). Tick a different combination if those
                  are not the ones you can realistically pass.
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-amber-700">
                    {next.label} cannot be reached by repeating.
                  </span>{" "}
                  Because repeats are capped at C, clearing every subject below
                  reaches at most{" "}
                  <span className="font-semibold">{ceiling.toFixed(2)}</span> —
                  short of the {next.min.toFixed(2)} needed. Only new subjects can
                  close the rest.
                </p>
              )
            ) : (
              <p className="text-sm text-gray-700">
                You are already in the highest class. Repeats can raise your GPA to
                at most <span className="font-semibold">{ceiling.toFixed(2)}</span>.
              </p>
            )}
          </div>

          {/* ---- Live selection summary ---- */}
          <div
            className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${reachesTarget
                ? "bg-emerald-50/60 border-emerald-100"
                : "bg-gray-50 border-gray-100"
              }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">
                {selected.size === 0
                  ? "No subjects selected"
                  : `${selected.size} selected`}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {currentGpa.toFixed(2)} →{" "}
                <span
                  className={
                    reachesTarget ? "text-emerald-700" : "text-indigo-700"
                  }
                >
                  {projected.toFixed(2)}
                </span>
              </span>
              {next && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${reachesTarget
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                    }`}
                >
                  {reachesTarget
                    ? `reaches ${next.label}`
                    : `${(next.min - projected).toFixed(2)} short of ${next.label}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {!isRecommended && recommended.length > 0 && (
                <button
                  onClick={() => setSelected(new Set(recommended))}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded transition-colors"
                >
                  Recommended
                </button>
              )}
              <button
                onClick={() => setSelected(new Set(ranked.map((r) => r.subjectCode)))}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded transition-colors"
              >
                All
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ---- Ranked, selectable table ---- */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="pl-5 pr-2 py-2.5 text-left font-medium w-8">
                    <span className="sr-only">Retake</span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium">#</th>
                  <th className="px-5 py-2.5 text-left font-medium">Subject</th>
                  <th className="px-5 py-2.5 text-center font-medium">Credits</th>
                  <th className="px-5 py-2.5 text-center font-medium">Now</th>
                  <th className="px-5 py-2.5 text-center font-medium">GPA Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ranked.map((s, i) => {
                  const isOn = selected.has(s.subjectCode);
                  return (
                    <tr
                      key={s.subjectCode}
                      onClick={() => toggle(s.subjectCode)}
                      className={`cursor-pointer transition-colors ${isOn ? "bg-emerald-50/40" : "hover:bg-gray-50/50 opacity-70"
                        }`}
                    >
                      <td className="pl-5 pr-2 py-2.5">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggle(s.subjectCode)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Retake ${s.subjectCode}`}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/40 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-400 font-medium">
                        {i + 1}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-gray-700">
                            {s.subjectCode}
                          </span>
                          {s.uncapped && (
                            <span
                              title="An earlier attempt was an approved MC, so this sitting is not capped at C — the gain shown is a floor, not a ceiling."
                              className="text-[10px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full"
                            >
                              MC · not capped
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.subjectName}
                        </p>
                      </td>
                      <td className="px-5 py-2.5 text-center text-gray-600 font-medium">
                        {s.credit}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {s.grade}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${isOn ? "text-emerald-700" : "text-gray-400"
                            }`}
                        >
                          <TrendingUp className="w-3 h-3" />+{s.gain.toFixed(3)}
                          {s.uncapped && "+"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---- Ceiling ---- */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500">
              Clearing all {ranked.length} — the maximum repeats can achieve
            </span>
            <span className="text-xs text-gray-700">
              {currentGpa.toFixed(2)} →{" "}
              <span className="font-bold text-indigo-700">
                {ceiling.toFixed(2)}
              </span>
              {classFor(ceiling) && (
                <span className="text-gray-400"> · {classFor(ceiling)}</span>
              )}
            </span>
          </div>
        </>
      )}

      {/* ---- Assumption disclosure ---- */}
      <div className="px-5 py-3 bg-amber-50/60 border-t border-amber-100 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>A repeat is capped at C (2.00)</strong> no matter how well you
          do, so these figures are the best case, not a prediction. The exception
          is a subject marked <strong>MC</strong>: that sitting counts as a first
          attempt, so it is not capped and its real gain can be higher than the{" "}
          <code className="font-mono">+</code> figure shown. The maths is exact —
          a repeat replaces the old grade for the same credits, so your total
          credits never change. Confirm eligibility and deadlines with your mentor
          before planning around this.
        </p>
      </div>
    </motion.div>
  );
}
