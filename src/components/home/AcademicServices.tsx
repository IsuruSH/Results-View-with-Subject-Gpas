import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  BookMarked,
  GraduationCap,
  FolderOpen,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { openFosmisPage } from "../../utils/fosmisNav";

const FOSMIS_BASE = "https://paravi.ruh.ac.lk/fosmis";

interface ServiceLink {
  label: string;
  url: string;
}

interface ServiceCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  links: ServiceLink[];
}

const categories: ServiceCategory[] = [
  {
    title: "Registration",
    icon: BookMarked,
    color: "text-blue-600 bg-blue-50",
    links: [
      {
        label: "Course Registration",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=1`,
      },
      {
        label: "Group Registration",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=41`,
      },
      {
        label: "Change the Medium of Degree",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=44`,
      },
      {
        label: "Exam Registration",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=48`,
      },
      {
        label: "Applying for Special Degree",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=61`,
      },
      {
        label: "Hostel Information",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=66`,
      },
      {
        label: "UCTIT & UTEL Registrations",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=68`,
      },
    ],
  },
  {
    title: "Examination",
    icon: GraduationCap,
    color: "text-purple-600 bg-purple-50",
    links: [
      {
        label: "View Results",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=11`,
      },
      {
        label: "Exam Eligibility",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=16`,
      },
      {
        label: "Download Medical Application",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=81`,
      },
      {
        label: "Examination Medical Application",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=84`,
      },
      {
        label: "Repeat Exam Payments",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=94`,
      },
    ],
  },
  {
    title: "Courses",
    icon: FolderOpen,
    color: "text-emerald-600 bg-emerald-50",
    links: [
      {
        label: "Download Past Papers",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=71`,
      },
    ],
  },
  {
    title: "Messages",
    icon: MessageSquare,
    color: "text-amber-600 bg-amber-50",
    links: [
      {
        label: "Individual Message",
        url: `${FOSMIS_BASE}/index.php?view=admin&admin=51`,
      },
    ],
  },
];

export default function AcademicServices() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Academic Services
      </h3>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        {categories.map((cat, i) => (
          <div key={cat.title}>
            {/* Accordion header */}
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg ${cat.color} flex items-center justify-center`}
                >
                  <cat.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {cat.title}
                </span>
                <span className="text-xs text-gray-400">
                  {cat.links.length} item{cat.links.length !== 1 ? "s" : ""}
                </span>
              </div>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            </button>

            {/* Accordion body */}
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-1">
                    {cat.links.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => openFosmisPage(link.url)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group cursor-pointer"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
