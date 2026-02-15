import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Plus, Trash2, ChevronDown, Info } from "lucide-react";
import { GRADE_OPTIONS } from "../../constants/grades";
import type { GpaFormData } from "../../types";

interface GpaCalculatorProps {
  gpaFormData: GpaFormData;
  setGpaFormData: React.Dispatch<React.SetStateAction<GpaFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function GpaCalculator({
  gpaFormData,
  setGpaFormData,
  onSubmit,
}: GpaCalculatorProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addSubjectField = () => {
    setGpaFormData((prev) => ({
      ...prev,
      manualSubjects: {
        subjects: [...prev.manualSubjects.subjects, ""],
        grades: [...prev.manualSubjects.grades, ""],
      },
    }));
  };

  const removeSubjectField = (index: number) => {
    setGpaFormData((prev) => ({
      ...prev,
      manualSubjects: {
        subjects: prev.manualSubjects.subjects.filter((_, i) => i !== index),
        grades: prev.manualSubjects.grades.filter((_, i) => i !== index),
      },
    }));
  };

  const updateSubject = (index: number, value: string) => {
    const newSubjects = [...gpaFormData.manualSubjects.subjects];
    newSubjects[index] = value;
    setGpaFormData((prev) => ({
      ...prev,
      manualSubjects: { ...prev.manualSubjects, subjects: newSubjects },
    }));
  };

  const updateGrade = (index: number, value: string) => {
    const newGrades = [...gpaFormData.manualSubjects.grades];
    newGrades[index] = value;
    setGpaFormData((prev) => ({
      ...prev,
      manualSubjects: { ...prev.manualSubjects, grades: newGrades },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              GPA Calculator
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            How to use
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showInstructions ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>

        {/* Collapsible instructions */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ol className="mt-3 space-y-2 text-xs text-gray-500 list-decimal pl-4 font-semibold">
                <li>
                  FOSMIS එකේ නැති Results තියෙනවනම් Add New Subjects වල
                  Subject code &amp; results add කරලා බලන්න.
                </li>
                <li>
                  FOSMIS එකේ නැති subjects සහ repeated &amp; MC subjects වල
                  results වෙනස් කරලා GPA එක බලන්න ඕන නම් "Include in
                  calculation" tick එක දාල results වෙනස් කරලා බලන්න.
                </li>
                <li>
                  Repeated &amp; MC subjects වල results විතරක් වෙනස් කරලා
                  GPA එක බලන්න ඕන නම් "Include in calculation" tick එක දාල
                  results change කරලා "Calculate GPA" button එක click
                  කරන්න.
                </li>
                <li>
                  When entering subject codes, enter{" "}
                  <code className="bg-gray-100 px-1 rounded">a</code> for
                  &apos;&alpha;&apos;,{" "}
                  <code className="bg-gray-100 px-1 rounded">b</code> for
                  &apos;&beta;&apos;,{" "}
                  <code className="bg-gray-100 px-1 rounded">d</code> for
                  &apos;&delta;&apos;.
                </li>
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
        {/* Subject rows */}
        <div className="space-y-3">
          {gpaFormData.manualSubjects.subjects.map((subject, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                id={`subject-code-${index}`}
                name={`subject-code-${index}`}
                placeholder="Subject Code"
                value={subject}
                onChange={(e) => {
                  updateSubject(index, e.target.value);
                  if (e.target.value) setErrors((prev) => { const n = { ...prev }; delete n[index]; return n; });
                }}
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all ${errors[index] ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
              />
              <select
                id={`subject-grade-${index}`}
                name={`subject-grade-${index}`}
                value={gpaFormData.manualSubjects.grades[index]}
                onChange={(e) => updateGrade(index, e.target.value)}
                className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
              >
                <option value="">Grade</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeSubjectField(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add subject button */}
        <button
          type="button"
          onClick={addSubjectField}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Another Subject
        </button>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 transition-all"
        >
          Calculate GPA
        </button>
      </form>
    </motion.div>
  );
}
