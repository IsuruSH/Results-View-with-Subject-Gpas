import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import type { GpaResults } from "../../types";

interface DepartmentRadarProps {
  results: GpaResults;
  /**
   * Render without the card chrome (background, border, padding), for use
   * inside a panel that already provides it — see GpaOverview.
   */
  bare?: boolean;
}

const DEPARTMENTS = [
  { key: "mathGpa" as const, label: "Math" },
  { key: "cheGpa" as const, label: "Chemistry" },
  { key: "phyGpa" as const, label: "Physics" },
  { key: "zooGpa" as const, label: "Zoology" },
  { key: "botGpa" as const, label: "Botany" },
  { key: "csGpa" as const, label: "CS" },
];

/** A radar needs at least 3 axes to be a shape rather than a line. */
const MIN_AXES = 3;

function activeDepartments(results: GpaResults) {
  return DEPARTMENTS.filter((d) => {
    const v = parseFloat((results[d.key] as string) ?? "");
    return !isNaN(v) && v > 0;
  });
}

/**
 * Whether the radar will render anything. Callers that lay the radar out in a
 * grid need to know this up front, so they can drop the whole column instead
 * of leaving an empty gap where a null render used to be.
 */
export function hasRadarData(results: GpaResults): boolean {
  return activeDepartments(results).length >= MIN_AXES;
}

const SIZE = 240;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 90;

/**
 * Horizontal breathing room added to the viewBox, outside the radar itself.
 *
 * With an even number of axes, two of them point straight left and right, so
 * their labels land on the very edge of a SIZE-wide box and get clipped —
 * "Chemistry" rendered as "Chemist" and "Zoology" as "oolo". The radar
 * geometry stays SIZE-based; only the visible box is wider.
 */
const PAD_X = 48;
const VIEW_BOX = `${-PAD_X} 0 ${SIZE + PAD_X * 2} ${SIZE}`;

/** Distance from centre at which the department name is drawn. */
const LABEL_R = MAX_R + 20;

/**
 * Anchor a label by the direction it sits in, so text grows away from the
 * chart instead of straddling the spoke: names on the right start at the
 * spoke, names on the left end at it, and names near the vertical axis stay
 * centred.
 */
function labelAnchor(dx: number): "start" | "middle" | "end" {
  if (Math.abs(dx) < MAX_R * 0.25) return "middle";
  return dx > 0 ? "start" : "end";
}

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

export default function DepartmentRadar({
  results,
  bare = false,
}: DepartmentRadarProps) {
  // Filter to only departments where the student has a GPA
  const activeDepts = activeDepartments(results);

  if (activeDepts.length < MIN_AXES) return null;

  const values = activeDepts.map((d) => {
    const v = parseFloat((results[d.key] as string) ?? "");
    return isNaN(v) ? 0 : v;
  });

  const step = 360 / activeDepts.length;
  const dataPolygon = makePolygon(values);

  return (
    <div
      className={
        bare
          ? ""
          : "bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5"
      }
    >
      <div
        className={`flex items-center gap-2 ${
          bare ? "justify-center mb-1" : "mb-4"
        }`}
      >
        <Radar className="w-4 h-4 text-gray-400" />
        <h3
          className={`font-semibold text-gray-400 uppercase tracking-wider ${
            bare ? "text-xs" : "text-sm"
          }`}
        >
          Department Strength
        </h3>
      </div>

      <svg
        viewBox={VIEW_BOX}
        className={`w-full mx-auto ${bare ? "max-w-[300px]" : "max-w-[340px]"}`}
      >
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

        {/* Department names, outside the outermost ring */}
        {activeDepts.map((dept, i) => {
          const { x, y } = polarToCart(i * step, LABEL_R);
          const anchor = labelAnchor(x - CX);
          // Nudge horizontally-anchored names off the spoke by a hair.
          const dx = anchor === "start" ? 3 : anchor === "end" ? -3 : 0;
          return (
            <text
              key={dept.key}
              x={x + dx}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-gray-500"
              fontSize="9"
              fontWeight="600"
            >
              {dept.label}
            </text>
          );
        })}

        {/* Value labels, drawn just inside the vertex. Outside the vertex they
            ran into the department name on the left and right spokes, where
            the two sit closest together ("oolo3.70"). */}
        {values.map((v, i) => {
          if (v === 0) return null;
          const vertexR = (v / 4.0) * MAX_R;
          const { x, y } = polarToCart(i * step, Math.max(vertexR - 12, 16));
          return (
            <text
              key={`val-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-indigo-600"
              fontSize="8.5"
              fontWeight="700"
            >
              {/* Two decimals: a GPA rounded to one decimal is a different
                  GPA — 3.45 and 3.54 both showed as "3.5". */}
              {v.toFixed(2)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
