import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { DEGREE_CREDIT_TARGETS } from "../../constants/grades";

interface CreditProgressProps {
  totalCredits: number | undefined;
}

export default function CreditProgress({ totalCredits }: CreditProgressProps) {
  const [degreeIdx, setDegreeIdx] = useState(0);
  const credits = totalCredits ?? 0;
  if (credits === 0) return null;

  const target = DEGREE_CREDIT_TARGETS[degreeIdx].credits;
  const pct = Math.min((credits / target) * 100, 100);
  const remaining = Math.max(target - credits, 0);

  const barColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Credit Progress
          </h3>
        </div>

        {/* Degree type toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {DEGREE_CREDIT_TARGETS.map((dt, idx) => (
            <button
              key={dt.label}
              onClick={() => setDegreeIdx(idx)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                degreeIdx === idx
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className={`h-full rounded-full ${barColor}`}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
          {credits} / {target} credits ({pct.toFixed(0)}%)
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {remaining > 0
          ? `${remaining} credits remaining to complete your degree`
          : "You have completed all required credits!"}
      </p>
    </motion.div>
  );
}
