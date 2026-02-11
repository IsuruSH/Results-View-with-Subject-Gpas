import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { GRADE_ORDER } from "../../constants/grades";

interface GradeDistributionProps {
  distribution: Record<string, number> | undefined;
}

function getBarColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-emerald-500";
  if (grade.startsWith("B")) return "bg-blue-500";
  if (grade.startsWith("C")) return "bg-amber-500";
  if (grade.startsWith("D")) return "bg-orange-500";
  return "bg-red-500";
}

export default function GradeDistribution({
  distribution,
}: GradeDistributionProps) {
  if (!distribution) return null;

  const entries = GRADE_ORDER.filter((g) => (distribution[g] ?? 0) > 0).map(
    (g) => ({ grade: g, count: distribution[g] })
  );

  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map((e) => e.count));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Grade Distribution
        </h3>
        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
          {entries.reduce((s, e) => s + e.count, 0)} subjects
        </span>
      </div>

      <div className="space-y-1.5">
        {entries.map(({ grade, count }, i) => {
          const pct = (count / maxCount) * 100;
          return (
            <div key={grade} className="flex items-center gap-2">
              <span className="w-7 text-right text-[11px] font-mono font-semibold text-gray-500">
                {grade}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    duration: 0.6,
                    delay: 0.2 + i * 0.05,
                    ease: "easeOut",
                  }}
                  className={`h-full rounded-full ${getBarColor(grade)}`}
                />
              </div>
              <span className="w-5 text-[11px] font-semibold text-gray-500">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
