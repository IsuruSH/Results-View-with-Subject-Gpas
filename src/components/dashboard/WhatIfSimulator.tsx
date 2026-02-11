import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { GRADE_SCALE, GRADE_OPTIONS } from "../../constants/grades";

interface WhatIfSimulatorProps {
  totalCredits: number | undefined;
  totalGradePoints: number | undefined;
}

interface SimRow {
  credits: string;
  grade: string;
}

export default function WhatIfSimulator({
  totalCredits,
  totalGradePoints,
}: WhatIfSimulatorProps) {
  const [rows, setRows] = useState<SimRow[]>([{ credits: "3", grade: "" }]);

  const currentCredits = totalCredits ?? 0;
  const currentGP = totalGradePoints ?? 0;

  const addRow = () =>
    setRows((prev) => [...prev, { credits: "3", grade: "" }]);

  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof SimRow, value: string) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  // Real-time projected GPA
  const projected = useMemo(() => {
    let addedCredits = 0;
    let addedGP = 0;

    for (const row of rows) {
      const cr = parseFloat(row.credits);
      const gp = GRADE_SCALE[row.grade];
      if (!isNaN(cr) && cr > 0 && gp !== undefined) {
        addedCredits += cr;
        addedGP += gp * cr;
      }
    }

    if (currentCredits + addedCredits === 0) return null;

    return {
      gpa: ((currentGP + addedGP) / (currentCredits + addedCredits)).toFixed(2),
      addedCredits,
      addedGP,
      totalCredits: currentCredits + addedCredits,
    };
  }, [rows, currentCredits, currentGP]);

  const currentGpa =
    currentCredits > 0 ? (currentGP / currentCredits).toFixed(2) : "0.00";

  return (
    <div className="space-y-4">
      {/* Current GPA reference */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Current: <strong className="text-gray-900">{currentGpa}</strong> GPA
          ({currentCredits} credits)
        </span>
        {projected && projected.addedCredits > 0 && (
          <span className="text-indigo-600 font-semibold">
            Projected: {projected.gpa} GPA
          </span>
        )}
      </div>

      {/* Subject rows */}
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select
              value={row.credits}
              onChange={(e) => updateRow(idx, "credits", e.target.value)}
              className="w-24 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="1">1 credit</option>
              <option value="1.25">1.25 cr</option>
              <option value="1.5">1.5 cr</option>
              <option value="2">2 credits</option>
              <option value="2.5">2.5 cr</option>
              <option value="3">3 credits</option>
              <option value="4">4 credits</option>
              <option value="5">5 credits</option>
              <option value="6">6 credits</option>
            </select>
            <select
              value={row.grade}
              onChange={(e) => updateRow(idx, "grade", e.target.value)}
              className="flex-1 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">Select grade</option>
              {GRADE_OPTIONS.filter((g) => g !== "MC").map((g) => (
                <option key={g} value={g}>
                  {g} ({GRADE_SCALE[g].toFixed(1)})
                </option>
              ))}
            </select>
            {rows.length > 1 && (
              <button
                onClick={() => removeRow(idx)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Subject
      </button>

      {/* Projected result */}
      {projected && projected.addedCredits > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 rounded-lg p-4 text-center"
        >
          <p className="text-2xl font-bold text-indigo-700">
            {projected.gpa}
          </p>
          <p className="text-xs text-indigo-500 mt-1">
            Projected GPA with {projected.addedCredits} additional credits
            (total {projected.totalCredits})
          </p>
        </motion.div>
      )}
    </div>
  );
}
