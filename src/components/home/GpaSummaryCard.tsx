import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight } from "lucide-react";
import type { GpaResults } from "../../types";

interface GpaSummaryCardProps {
  results: GpaResults | null;
}

export default function GpaSummaryCard({ results }: GpaSummaryCardProps) {
  const navigate = useNavigate();

  if (!results || !results.gpa) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">GPA Overview</h3>
          <TrendingUp className="w-4 h-4 text-gray-300" />
        </div>
        <p className="text-sm text-gray-400">
          View your results to see GPA data here.
        </p>
        <button
          onClick={() => navigate("/results")}
          className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
        >
          Go to Results <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>
    );
  }

  const gpaNum = parseFloat(results.gpa);
  const percent = Math.min((gpaNum / 4.0) * 100, 100);
  const levelGpas = results.levelGpas;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">GPA Overview</h3>
          <button
            onClick={() => navigate("/results")}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            Details <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* GPA circular indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#gpaGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${percent * 2.64} 264`}
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${percent * 2.64} 264` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gpaGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{gpaNum.toFixed(2)}</span>
              <span className="text-xs text-gray-400">/ 4.00</span>
            </div>
          </div>
        </div>

        {/* Level GPA breakdown */}
        {levelGpas && (
          <div className="space-y-2">
            {levelGpas.level1 && (
              <LevelBar label="Level 1" value={levelGpas.level1} />
            )}
            {levelGpas.level2 && (
              <LevelBar label="Level 2" value={levelGpas.level2} />
            )}
            {levelGpas.level3 && (
              <LevelBar label="Level 3" value={levelGpas.level3} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LevelBar({ label, value }: { label: string; value: string }) {
  const num = parseFloat(value);
  const pct = Math.min((num / 4.0) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">
        {num.toFixed(2)}
      </span>
    </div>
  );
}
