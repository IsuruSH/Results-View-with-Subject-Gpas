import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface GpaTrendChartProps {
  levelGpas: { level1?: string; level2?: string; level3?: string } | undefined;
}

const CHART_W = 280;
const CHART_H = 160;
const PAD_L = 40;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 30;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

function yPos(gpa: number): number {
  return PAD_T + PLOT_H - (gpa / 4.0) * PLOT_H;
}

export default function GpaTrendChart({ levelGpas }: GpaTrendChartProps) {
  if (!levelGpas) return null;

  const points: { x: number; y: number; label: string; value: number }[] = [];
  const levels = [
    { key: "level1" as const, label: "L1" },
    { key: "level2" as const, label: "L2" },
    { key: "level3" as const, label: "L3" },
  ];

  levels.forEach((lvl, idx) => {
    const val = parseFloat(levelGpas[lvl.key] ?? "");
    if (!isNaN(val)) {
      const x = PAD_L + (idx / 2) * PLOT_W;
      points.push({ x, y: yPos(val), label: lvl.label, value: val });
    }
  });

  if (points.length === 0) return null;

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  // Area fill polygon: line + bottom-right + bottom-left
  const areaPath =
    polyline +
    ` ${points[points.length - 1].x},${PAD_T + PLOT_H} ${points[0].x},${PAD_T + PLOT_H}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          GPA Trend
        </h3>
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full max-w-[320px] mx-auto"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
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

        {/* Area fill */}
        {points.length > 1 && (
          <motion.polygon
            points={areaPath}
            fill="url(#trendFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
        )}

        {/* Line */}
        <motion.polyline
          points={polyline}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />

        {/* Dots + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#6366f1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.2 }}
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="fill-gray-700 font-semibold"
              fontSize="10"
            >
              {p.value.toFixed(2)}
            </text>
            <text
              x={p.x}
              y={PAD_T + PLOT_H + 16}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize="10"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
