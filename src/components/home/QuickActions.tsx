import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  User,
  FileText,
  ClipboardList,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react";

const FOSMIS_BASE = "https://paravi.ruh.ac.lk/fosmis";

const actions = [
  {
    title: "View Results",
    description: "GPA analytics & detailed results",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/25",
    route: "/results",
  },
  {
    title: "Personal Info",
    description: "View & update your details",
    icon: User,
    color: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/25",
    href: `${FOSMIS_BASE}/index.php?task=personal`,
  },
  {
    title: "Exam Registration",
    description: "Register for upcoming exams",
    icon: ClipboardList,
    color: "from-orange-500 to-amber-600",
    shadow: "shadow-orange-500/25",
    href: `${FOSMIS_BASE}/index.php?view=admin&admin=48`,
  },
  {
    title: "Course Registration",
    description: "Register for courses",
    icon: BookOpen,
    color: "from-purple-500 to-violet-600",
    shadow: "shadow-purple-500/25",
    href: `${FOSMIS_BASE}/index.php?view=admin&admin=1`,
  },
  {
    title: "Exam Eligibility",
    description: "Check your eligibility status",
    icon: FileText,
    color: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/25",
    href: `${FOSMIS_BASE}/index.php?view=admin&admin=16`,
  },
  {
    title: "Past Papers",
    description: "Download previous exam papers",
    icon: FileSpreadsheet,
    color: "from-cyan-500 to-sky-600",
    shadow: "shadow-cyan-500/25",
    href: `${FOSMIS_BASE}/index.php?view=admin&admin=71`,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Quick Actions
      </h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {actions.map((action) => (
          <motion.button
            key={action.title}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (action.route) {
                navigate(action.route);
              } else if (action.href) {
                window.open(action.href, "_blank", "noopener,noreferrer");
              }
            }}
            className={`group relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4 text-left shadow-sm hover:shadow-lg ${action.shadow} transition-all duration-200`}
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-sm`}
            >
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
              {action.title}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {action.description}
            </p>

            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
