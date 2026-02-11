import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { CLASS_CUTOFFS } from "../../constants/grades";

interface ClassPredictorProps {
  gpa: string | undefined;
}

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  emerald: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-100 text-blue-700",
  },
  amber: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    badge: "bg-amber-100 text-amber-700",
  },
  orange: {
    bg: "bg-orange-50 border-orange-200",
    text: "text-orange-800",
    badge: "bg-orange-100 text-orange-700",
  },
  gray: {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-600",
  },
};

export default function ClassPredictor({ gpa }: ClassPredictorProps) {
  const numGpa = parseFloat(gpa || "");
  if (isNaN(numGpa)) return null;

  // Find current class
  const currentClass = CLASS_CUTOFFS.find((c) => numGpa >= c.min);
  // Find next class (the one above current)
  const currentIdx = currentClass
    ? CLASS_CUTOFFS.indexOf(currentClass)
    : CLASS_CUTOFFS.length;
  const nextClass = currentIdx > 0 ? CLASS_CUTOFFS[currentIdx - 1] : null;
  const gap = nextClass ? (nextClass.min - numGpa).toFixed(2) : null;

  const colors = COLOR_MAP[currentClass?.color ?? "gray"];
  const label = currentClass?.label ?? "Below Pass";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center gap-3 ${colors.bg}`}
    >
      <Award className={`w-5 h-5 flex-shrink-0 ${colors.text}`} />
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <span className={`text-sm font-semibold ${colors.text}`}>
          You&apos;re on track for
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}
        >
          {label}
        </span>
      </div>
      {nextClass && gap && (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {gap} away from {nextClass.label.split(" ").slice(0, 2).join(" ")}
        </span>
      )}
    </motion.div>
  );
}
