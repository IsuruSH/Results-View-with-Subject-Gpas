import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, FlaskConical, Target } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "calculator", label: "GPA Calculator", icon: <Calculator className="w-3.5 h-3.5" /> },
  { id: "whatif", label: "What-If", icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: "target", label: "Target Planner", icon: <Target className="w-3.5 h-3.5" /> },
];

interface AnalyticsTabsProps {
  calculatorContent: React.ReactNode;
  whatIfContent: React.ReactNode;
  targetContent: React.ReactNode;
}

export default function AnalyticsTabs({
  calculatorContent,
  whatIfContent,
  targetContent,
}: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState("calculator");

  const content: Record<string, React.ReactNode> = {
    calculator: calculatorContent,
    whatif: whatIfContent,
    target: targetContent,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.label.split(" ")[0]}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-6">{content[activeTab]}</div>
    </motion.div>
  );
}
