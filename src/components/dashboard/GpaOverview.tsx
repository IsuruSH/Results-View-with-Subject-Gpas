import { motion } from "framer-motion";
import GpaGauge from "./GpaGauge";
import DepartmentRadar, { hasRadarData } from "./DepartmentRadar";
import { GPA_LABELS } from "../../constants/grades";
import type { GpaResults } from "../../types";

interface GpaOverviewProps {
  results: GpaResults;
}

/**
 * Labels in GPA_LABELS are suffixed with "GPA" for use in standalone places.
 * Inside a panel already titled "GPA Overview" that repetition only costs
 * width, which matters here because department gauges sit two to a row.
 */
function shortLabel(label: string): string {
  return label.replace(/\s*GPA$/i, "");
}

export default function GpaOverview({ results }: GpaOverviewProps) {
  const overallGpa = results.gpa;
  const hasOverall = overallGpa && !isNaN(Number(overallGpa));

  // Collect department GPAs that have real values
  const departmentGpas = Object.entries(GPA_LABELS)
    .filter(([key]) => key !== "gpa") // exclude overall
    .map(([key, label]) => ({
      key,
      label: shortLabel(label),
      value: results[key as keyof GpaResults] as string,
    }))
    .filter((item) => item.value && !isNaN(Number(item.value)));

  const showRadar = hasRadarData(results);

  if (!hasOverall && departmentGpas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6"
    >
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
        GPA Overview
      </h2>

      {/*
        One row instead of three stacked blocks: overall on the left, the
        department gauges two-up in the middle, the radar on the right. The
        column widths are content-sized so the middle block keeps the
        remaining space and the row collapses to a single column on mobile.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_auto] gap-6 items-center">
        {/* Overall GPA - left */}
        {hasOverall && (
          <div className="flex justify-center lg:justify-start">
            <GpaGauge
              value={overallGpa!}
              label="Overall GPA"
              size={140}
              strokeWidth={9}
            />
          </div>
        )}

        {/* Department GPAs - right of the overall, two per row.
            `w-fit` keeps the pair tight; without it the 1fr column stretches
            the two gauges to opposite edges of the panel. */}
        {departmentGpas.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-fit mx-auto">
            {departmentGpas.map(({ key, label, value }) => (
              <div key={key} className="w-[124px] flex justify-center">
                <GpaGauge
                  value={value}
                  label={label}
                  size={80}
                  strokeWidth={6}
                />
              </div>
            ))}
          </div>
        )}

        {/* Department strength radar - same section, far right */}
        {showRadar && (
          <div className="lg:justify-self-end lg:border-l lg:border-gray-100 lg:pl-6">
            <DepartmentRadar results={results} bare />
          </div>
        )}
      </div>
    </motion.div>
  );
}
