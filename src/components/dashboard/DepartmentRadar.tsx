import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import type { GpaResults } from "../../types";

interface DepartmentRadarProps {
  results: GpaResults;
}

const DEPARTMENTS = [
  { key: "mathGpa" as const, label: "Math" },
  { key: "cheGpa" as const, label: "Chemistry" },
  { key: "phyGpa" as const, label: "Physics" },
  { key: "zooGpa" as const, label: "Zoology" },
  { key: "botGpa" as const, label: "Botany" },
  { key: "csGpa" as const, label: "CS" },
];

const SIZE = 240;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 90;

function polarToCart(
  angle: number,
  radius: number
): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function makePolygon(values: number[]): string {
  const step = 360 / values.length;
  return values
    .map((v, i) => {
      const r = (v / 4.0) * MAX_R;
      const { x, y } = polarToCart(i * step, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function makeGridPolygon(level: number, count: number): string {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const r = (level / 4.0) * MAX_R;
    const { x, y } = polarToCart(i * step, r);
    return `${x},${y}`;
  }).join(" ");
}

export default function DepartmentRadar({ results }: DepartmentRadarProps) {
  // Filter to only departments where the student has a GPA
  const activeDepts = DEPARTMENTS.filter((d) => {
    const v = parseFloat((results[d.key] as string) ?? "");
    return !isNaN(v) && v > 0;
  });

  // Only render if at least 3 departments have data
  if (activeDepts.length < 3) return null;

  const values = activeDepts.map((d) => {
    const v = parseFloat((results[d.key] as string) ?? "");
    return isNaN(v) ? 0 : v;
  });

  const step = 360 / activeDepts.length;
  const dataPolygon = makePolygon(values);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radar className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Department Strength
        </h3>
      </div>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[260px] mx-auto">
        {/* Grid polygons */}
        {[1, 2, 3, 4].map((level) => (
          <polygon
            key={level}
            points={makeGridPolygon(level, activeDepts.length)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.75"
          />
        ))}

        {/* Axis lines */}
        {activeDepts.map((_, i) => {
          const { x, y } = polarToCart(i * step, MAX_R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          points={dataPolygon}
          fill="rgba(99,102,241,0.15)"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {/* Data points */}
        {values.map((v, i) => {
          const r = (v / 4.0) * MAX_R;
          const { x, y } = polarToCart(i * step, r);
          return v > 0 ? (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#6366f1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
          ) : null;
        })}

        {/* Labels */}
        {activeDepts.map((dept, i) => {
          const labelR = MAX_R + 18;
          const { x, y } = polarToCart(i * step, labelR);
          return (
            <text
              key={dept.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-500"
              fontSize="9"
              fontWeight="600"
            >
              {dept.label}
            </text>
          );
        })}

        {/* Value labels */}
        {values.map((v, i) => {
          if (v === 0) return null;
          const r = (v / 4.0) * MAX_R + 10;
          const { x, y } = polarToCart(i * step, r);
          return (
            <text
              key={`val-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-indigo-600"
              fontSize="8"
              fontWeight="700"
            >
              {v.toFixed(1)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
