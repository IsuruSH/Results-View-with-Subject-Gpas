import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  buildLevelSeries,
  buildLevelSeriesFromBreakdown,
  buildSemesterSeries,
  type TrendMode,
} from "../../utils/gpaTrend";
import type { SubjectBreakdownRow } from "../../types";
import { analytics } from "../../services/analytics";

interface GpaTrendChartProps {
  levelGpas: { level1?: string; level2?: string; level3?: string } | undefined;
  /** Per-subject rows, used to derive the semester split and the cumulative line. */
  subjectBreakdown?: SubjectBreakdownRow[];
}

const CHART_W = 440;
const CHART_H = 200;
const PAD_L = 34;
const PAD_R = 16;
const PAD_T = 22;
const PAD_B = 28;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

const PERIOD_COLOR = "#6366f1"; // indigo — this period on its own
const CUMULATIVE_COLOR = "#0d9488"; // teal — everything so far

function yPos(gpa: number): number {
  return PAD_T + PLOT_H - (gpa / 4.0) * PLOT_H;
}

export default function GpaTrendChart({
  levelGpas,
  subjectBreakdown,
}: GpaTrendChartProps) {
  const semesterSeries = useMemo(
    () => buildSemesterSeries(subjectBreakdown),
    [subjectBreakdown]
  );
  const levelSeries = useMemo(() => {
    // Prefer the breakdown-derived levels: identical GPAs, but they carry
    // credits, which is what makes the cumulative line possible.
    const derived = buildLevelSeriesFromBreakdown(subjectBreakdown);
    return derived.length > 0 ? derived : buildLevelSeries(levelGpas);
  }, [subjectBreakdown, levelGpas]);

  // Semester is the richer view, so it leads when there is enough of it to
  // form a line; otherwise fall back to the level figures. The choice is held
  // as null-until-chosen rather than seeded into useState, because the chart
  // can mount before the results arrive — a seeded default would latch onto
  // whatever was known at mount and never pick up the semester data.
  const canSplit = semesterSeries.length >= 2;
  const [chosenMode, setChosenMode] = useState<TrendMode | null>(null);
  const mode: TrendMode = chosenMode ?? (canSplit ? "semester" : "level");

  const series = mode === "semester" && canSplit ? semesterSeries : levelSeries;

  if (series.length === 0) return null;

  const denom = Math.max(series.length - 1, 1);
  const points = series.map((p, idx) => {
    const x =
      series.length === 1 ? PAD_L + PLOT_W / 2 : PAD_L + (idx / denom) * PLOT_W;
    const y = yPos(p.value);
    const cy = p.cumulative === null ? null : yPos(p.cumulative);

    // The two lines cross repeatedly, so a fixed above/below rule puts the
    // labels on top of each other. Instead, whichever point sits higher gets
    // the label above it and the other gets the label below — that keeps them
    // at least ~21px apart no matter how close the lines run.
    const clamp = (v: number) => Math.min(Math.max(v, 10), CHART_H - 4);
    const cumulativeIsLower = cy === null || cy >= y;

    return {
      ...p,
      x,
      y,
      cy,
      valueLabelY: clamp(cumulativeIsLower ? y - 9 : y + 12),
      cumulativeLabelY: cy === null ? 0 : clamp(cumulativeIsLower ? cy + 12 : cy - 9),
    };
  });

  const hasCumulative = points.every((p) => p.cy !== null);

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const cumulativeLine = hasCumulative
    ? points.map((p) => `${p.x},${p.cy}`).join(" ")
    : "";
  // Area fill polygon: line + bottom-right + bottom-left
  const areaPath =
    polyline +
    ` ${points[points.length - 1].x},${PAD_T + PLOT_H} ${points[0].x},${PAD_T + PLOT_H}`;

  const dense = points.length > 4;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            GPA Trend
          </h3>
        </div>

        {canSplit && (
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            {(
              [
                { key: "level", label: "Level" },
                { key: "semester", label: "Semester" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  analytics.trendModeChanged(key);
                  setChosenMode(key);
                }}
                aria-pressed={mode === key}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full max-w-[480px] mx-auto"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PERIOD_COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PERIOD_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines at 1.0, 2.0, 3.0, 4.0 */}
        {[1, 2, 3, 4].map((g) => (
          <g key={g}>
            <line
              x1={PAD_L}
              y1={yPos(g)}
              x2={CHART_W - PAD_R}
              y2={yPos(g)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={yPos(g) + 3}
              textAnchor="end"
              className="fill-gray-400"
              fontSize="9"
            >
              {g.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Area fill under the per-period line */}
        {points.length > 1 && (
          <motion.polygon
            points={areaPath}
            fill="url(#trendFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
        )}

        {/* Per-period line */}
        <motion.polyline
          points={polyline}
          fill="none"
          stroke={PERIOD_COLOR}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />

        {/* Cumulative line — dashed so the two never read as one series.
            Fades in rather than drawing itself: framer-motion implements
            `pathLength` by writing its own strokeDasharray, which would
            silently override the dash pattern and render this solid. */}
        {hasCumulative && (
          <motion.polyline
            points={cumulativeLine}
            fill="none"
            stroke={CUMULATIVE_COLOR}
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeLinecap="butt"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          />
        )}

        {/* Cumulative dots + values, below the point to stay clear of the
            per-period labels above it. */}
        {hasCumulative &&
          points.map((p, i) => (
            <g key={`cum-${p.label}`}>
              <title>{`${p.title} — cumulative ${p.cumulative!.toFixed(2)}`}</title>
              <motion.circle
                cx={p.x}
                cy={p.cy!}
                r={dense ? 2.5 : 3.5}
                fill={CUMULATIVE_COLOR}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + i * 0.12 }}
              />
              <text
                x={p.x}
                y={p.cumulativeLabelY}
                textAnchor="middle"
                fill={CUMULATIVE_COLOR}
                className="font-semibold"
                fontSize={dense ? 8 : 9}
              >
                {p.cumulative!.toFixed(2)}
              </text>
            </g>
          ))}

        {/* Per-period dots, values and axis labels */}
        {points.map((p, i) => (
          <g key={p.label}>
            <title>{`${p.title} — GPA ${p.value.toFixed(2)}`}</title>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={dense ? 3 : 4}
              fill={PERIOD_COLOR}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.12 }}
            />
            <text
              x={p.x}
              y={p.valueLabelY}
              textAnchor="middle"
              fill={PERIOD_COLOR}
              className="font-semibold"
              fontSize={dense ? 8.5 : 10}
            >
              {p.value.toFixed(2)}
            </text>
            <text
              x={p.x}
              y={PAD_T + PLOT_H + 16}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={dense ? 8.5 : 10}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend, outside the plot: the line colours carry the explanation,
          so no prose caption is needed. */}
      <div className="mt-2 flex items-center justify-center gap-5 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-[2px] rounded"
            style={{ backgroundColor: PERIOD_COLOR }}
          />
          This {mode === "semester" ? "semester" : "level"}
        </span>
        {hasCumulative && (
          <span className="flex items-center gap-1.5">
            {/* Dashed, to match the line it stands for. */}
            <span
              className="inline-block w-4"
              style={{ borderTop: `2px dashed ${CUMULATIVE_COLOR}` }}
            />
            Cumulative
          </span>
        )}
      </div>
    </div>
  );
}
