import { motion } from "framer-motion";
import GpaGauge from "./GpaGauge";
import { GPA_LABELS } from "../../constants/grades";
import type { GpaResults } from "../../types";

interface GpaOverviewProps {
  results: GpaResults;
}

export default function GpaOverview({ results }: GpaOverviewProps) {
  const overallGpa = results.gpa;
  const hasOverall = overallGpa && !isNaN(Number(overallGpa));

  // Collect department GPAs that have real values
  const departmentGpas = Object.entries(GPA_LABELS)
    .filter(([key]) => key !== "gpa") // exclude overall
    .map(([key, label]) => ({
      key,
      label,
      value: results[key as keyof GpaResults] as string,
    }))
    .filter((item) => item.value && !isNaN(Number(item.value)));

  if (!hasOverall && departmentGpas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
        GPA Overview
      </h2>

      {/* Overall GPA - Hero Gauge */}
      {hasOverall && (
        <div className="flex justify-center mb-8">
          <GpaGauge
            value={overallGpa!}
            label="Overall GPA"
            size={160}
            strokeWidth={10}
          />
        </div>
      )}

      {/* Department GPAs - Grid */}
      {departmentGpas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {departmentGpas.map(({ key, label, value }) => (
            <GpaGauge
              key={key}
              value={value}
              label={label}
              size={100}
              strokeWidth={6}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
