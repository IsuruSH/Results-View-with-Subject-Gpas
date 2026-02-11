import { motion } from "framer-motion";

interface GpaGaugeProps {
  value: string;
  label: string;
  size?: number;
  strokeWidth?: number;
}

function getColor(gpa: number): string {
  if (gpa >= 3.5) return "#22c55e"; // green-500
  if (gpa >= 3.0) return "#3b82f6"; // blue-500
  if (gpa >= 2.0) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function getBgColor(gpa: number): string {
  if (gpa >= 3.5) return "rgba(34,197,94,0.1)";
  if (gpa >= 3.0) return "rgba(59,130,246,0.1)";
  if (gpa >= 2.0) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}

export default function GpaGauge({
  value,
  label,
  size = 120,
  strokeWidth = 8,
}: GpaGaugeProps) {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(numericValue / 4.0, 1);
  const offset = circumference * (1 - progress);
  const color = getColor(numericValue);
  const bgColor = getBgColor(numericValue);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-gray-200"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        {/* Center value */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
          style={{ backgroundColor: bgColor }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="font-bold text-gray-900"
            style={{ fontSize: size * 0.22 }}
          >
            {numericValue.toFixed(2)}
          </motion.span>
          <span
            className="text-gray-400 font-medium"
            style={{ fontSize: size * 0.09 }}
          >
            / 4.00
          </span>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-600 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
