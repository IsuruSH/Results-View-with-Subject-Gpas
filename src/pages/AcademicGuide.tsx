import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Calculator,
  Award,
  ChevronDown,
  Info,
  Target,
  Clock,
  Hash,
  FileText,
  Trophy,
  Building2,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { fetchResults, fetchCourseRegistration } from "../services/api";
import { getProfileImage, getCached, CACHE_KEYS } from "../services/dataCache";
import type { GpaResults, CourseRegistrationData } from "../types";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import DegreeProgress from "../components/guide/DegreeProgress";

// ---------------------------------------------------------------------------
// Section Data
// ---------------------------------------------------------------------------

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function InfoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-indigo-50/60 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-900 leading-relaxed ${className}`}
    >
      {children}
    </div>
  );
}

function SinhalaNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-500 mt-2 italic leading-relaxed">
      {children}
    </p>
  );
}

function RequirementList({
  items,
}: {
  items: { text: string; sinhala?: string }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
          <div>
            <span className="text-sm text-gray-700">{item.text}</span>
            {item.sinhala && <SinhalaNote>{item.sinhala}</SinhalaNote>}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Section Content Builders
// ---------------------------------------------------------------------------

function DepartmentsContent() {
  const departments = [
    { name: "Computer Science", prefix: "CSC / COM", color: "bg-blue-500" },
    { name: "Mathematics", prefix: "MAT", color: "bg-indigo-500" },
    {
      name: "Applied Mathematics",
      prefix: "AMT / IMT",
      color: "bg-violet-500",
    },
    { name: "Physics", prefix: "PHY", color: "bg-amber-500" },
    { name: "Chemistry", prefix: "CHE", color: "bg-emerald-500" },
    { name: "Zoology", prefix: "ZOO", color: "bg-rose-500" },
    { name: "Botany", prefix: "BOT", color: "bg-green-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {departments.map((dept) => (
        <div
          key={dept.name}
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-3 hover:shadow-sm transition-shadow"
        >
          <div
            className={`w-10 h-10 ${dept.color} rounded-lg flex items-center justify-center`}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
            <p className="text-xs text-gray-400 font-mono">{dept.prefix}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SlqfContent() {
  return (
    <div className="space-y-4">
      <InfoCard>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">
              Sri Lankan Qualification Framework (SLQF)
            </p>
            <p>
              SLQF is a nationally accepted framework developed for higher
              education qualifications in Sri Lanka. Higher education programmes
              are assigned to 10 levels.
            </p>
            <SinhalaNote>
              SLQF hkq › ,xldfõ Wiia wOHdmk iqÿiqlï i|yd ilia lrk ,o cd;sl
              ms&lt;s.ekSula we;s rduqjls' fuysoS Wiia wOHdmk mdGud,d uÜgï 10
              lg fjkalr we;'
            </SinhalaNote>
          </div>
        </div>
      </InfoCard>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <th className="px-4 py-3 text-left font-semibold text-indigo-900 rounded-tl-lg">
                Degree Program
              </th>
              <th className="px-4 py-3 text-center font-semibold text-indigo-900">
                Min. Credits
              </th>
              <th className="px-4 py-3 text-center font-semibold text-indigo-900 rounded-tr-lg">
                SLQF Level
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700 font-medium">
                General Degree (BSc / BCS)
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-10 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  90
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-8 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                  5
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-gray-700 font-medium">
                Special Degree (BSc Hons / BCS Hons)
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-10 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  120
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-8 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                  6
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SemesterContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <p className="font-semibold text-sm text-gray-900">Duration</p>
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            15 <span className="text-sm font-normal text-gray-500">weeks</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">per semester</p>
          <SinhalaNote>Semester 1 la i;s 15 lska hqla; fõ'</SinhalaNote>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-sm text-gray-900">
              Max Credits / Semester
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            18{" "}
            <span className="text-sm font-normal text-gray-500">credits</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">maximum registration</p>
          <SinhalaNote>
            Semester 1 la ;=&lt;oS ,shdmosxÑ úh yelafla Wmßu jYfhka Credits 18
            la i|yd muKs
          </SinhalaNote>
        </div>
      </div>
    </div>
  );
}

function CreditsContent() {
  return (
    <div className="space-y-4">
      <InfoCard>
        <p>
          Credit values are assigned to Course Units based on workload hours.
          A <strong>Credit</strong> is a time-based numerical measure used to
          determine the weight of Course Units.
        </p>
        <SinhalaNote>
          Credit hkq Course Units j, Ndrhka ks¾Kh lsÍu i|yd fhdod .kakd"
          ld,h u; mokï jQ ixLHd;aul ñkquls.
        </SinhalaNote>
      </InfoCard>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <th className="px-4 py-3 text-left font-semibold text-indigo-900 rounded-tl-lg">
                Description
              </th>
              <th className="px-4 py-3 text-center font-semibold text-indigo-900 rounded-tr-lg">
                Credit Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-blue-50/30">
              <td
                colSpan={2}
                className="px-4 py-2 text-xs font-bold text-blue-700 uppercase tracking-wider"
              >
                Theory
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">15 hours</td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                1
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">30 hours</td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                2
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">45 hours</td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                3
              </td>
            </tr>
            <tr className="bg-emerald-50/30">
              <td
                colSpan={2}
                className="px-4 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider"
              >
                Practical
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                30 – 45 hours
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                1
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                45 – 60 hours
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                2
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                60 – 90 hours
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                3
              </td>
            </tr>
            <tr className="bg-purple-50/30">
              <td
                colSpan={2}
                className="px-4 py-2 text-xs font-bold text-purple-700 uppercase tracking-wider"
              >
                Projects
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                30 – 45 hours
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                1
              </td>
            </tr>
            <tr className="bg-amber-50/30">
              <td
                colSpan={2}
                className="px-4 py-2 text-xs font-bold text-amber-700 uppercase tracking-wider"
              >
                Combined (Theory + Practical)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                30 hrs Theory + 45 hrs Practical
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                3
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                15 hrs Theory + 45 hrs Practical
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                2
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">
                30 hrs Theory + 22.5 hrs Practical
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                2.5
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseUnitsContent() {
  return (
    <div className="space-y-4">
      <InfoCard>
        <p className="font-medium mb-2">Course Code Structure</p>
        <p>
          Each course has a unique code. The last character indicates the credit
          value using special symbols:
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { sym: "α", val: "1.5 credits" },
            { sym: "β", val: "2.5 credits" },
            { sym: "δ", val: "1.25 credits" },
          ].map((s) => (
            <span
              key={s.sym}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-sm"
            >
              <span className="text-lg font-bold text-indigo-600">{s.sym}</span>
              <span className="text-gray-600">= {s.val}</span>
            </span>
          ))}
        </div>
      </InfoCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <p className="font-semibold text-sm text-gray-900">Core Courses</p>
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            75{" "}
            <span className="text-sm font-normal text-gray-500">credits</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">required credits</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <p className="font-semibold text-sm text-gray-900">
              Optional Courses
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            15{" "}
            <span className="text-sm font-normal text-gray-500">credits</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            including max 6 credits FSC
          </p>
        </div>
      </div>
    </div>
  );
}

function GpaCalculationContent() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">
          GPA Formula
        </p>
        <div className="bg-white rounded-lg p-4 border border-indigo-100 text-center">
          <p className="text-lg font-semibold text-gray-900">
            GPA ={" "}
            <span className="text-indigo-600">
              &Sigma; (Grade Point Value &times; Credits of that Course)
            </span>
          </p>
          <div className="w-48 h-px bg-indigo-300 mx-auto my-2" />
          <p className="text-lg font-semibold text-indigo-600">Total Credits</p>
        </div>
        <div className="mt-4 bg-white/70 rounded-lg p-3 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-1">Example:</p>
          <p>
            If you have 3 courses: Course A (3 credits, A grade = 4.0), Course B
            (2 credits, B+ grade = 3.3), Course C (3 credits, C grade = 2.0)
          </p>
          <p className="mt-2 font-medium text-indigo-700">
            GPA = (3&times;4.0 + 2&times;3.3 + 3&times;2.0) / (3+2+3) ={" "}
            <span className="text-lg">24.6 / 8 = 3.075</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function GradesContent() {
  const grades = [
    { grade: "A+", gpv: 4.0, marks: "85 – 100", color: "bg-emerald-500" },
    { grade: "A", gpv: 4.0, marks: "70 – 84", color: "bg-emerald-400" },
    { grade: "A-", gpv: 3.7, marks: "65 – 69", color: "bg-green-400" },
    { grade: "B+", gpv: 3.3, marks: "60 – 64", color: "bg-blue-400" },
    { grade: "B", gpv: 3.0, marks: "55 – 59", color: "bg-blue-300" },
    { grade: "B-", gpv: 2.7, marks: "50 – 54", color: "bg-sky-400" },
    { grade: "C+", gpv: 2.3, marks: "45 – 49", color: "bg-amber-400" },
    { grade: "C", gpv: 2.0, marks: "40 – 44", color: "bg-amber-300" },
    { grade: "C-", gpv: 1.7, marks: "35 – 39", color: "bg-orange-400" },
    { grade: "D+", gpv: 1.3, marks: "30 – 34", color: "bg-orange-300" },
    { grade: "D", gpv: 1.0, marks: "25 – 29", color: "bg-red-300" },
    { grade: "E", gpv: 0.0, marks: "0 – 24", color: "bg-red-500" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <th className="px-4 py-3 text-left font-semibold text-indigo-900 rounded-tl-lg w-20">
              Grade
            </th>
            <th className="px-4 py-3 text-center font-semibold text-indigo-900">
              Grade Point Value
            </th>
            <th className="px-4 py-3 text-center font-semibold text-indigo-900">
              Marks Range (%)
            </th>
            <th className="px-4 py-3 text-right font-semibold text-indigo-900 rounded-tr-lg">
              Scale
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {grades.map((g) => (
            <tr key={g.grade} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center justify-center w-10 h-7 rounded-md bg-gray-100 text-xs font-bold text-gray-800">
                  {g.grade}
                </span>
              </td>
              <td className="px-4 py-2.5 text-center font-semibold text-gray-900">
                {g.gpv.toFixed(1)}
              </td>
              <td className="px-4 py-2.5 text-center text-gray-600">
                {g.marks}
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${g.color}`}
                      style={{ width: `${(g.gpv / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HonorsContent() {
  const classes = [
    {
      label: "First Class Honours",
      gpa: "3.70",
      credits: "40+ credits with A grade",
      color: "from-amber-400 to-yellow-500",
      icon: "🥇",
    },
    {
      label: "Second Class - Upper Division",
      gpa: "3.30",
      credits: "40+ credits with B grade",
      color: "from-gray-300 to-gray-400",
      icon: "🥈",
    },
    {
      label: "Second Class - Lower Division",
      gpa: "3.00",
      credits: "40+ credits with B grade",
      color: "from-amber-600 to-amber-700",
      icon: "🥉",
    },
  ];

  return (
    <div className="space-y-4">
      <InfoCard>
        <p>
          Honours classifications are awarded to General Degree students based on
          overall GPA and minimum grade requirements across a specified number of
          credits.
        </p>
      </InfoCard>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div
            key={c.label}
            className="relative bg-white rounded-xl border border-gray-100 p-5 text-center overflow-hidden"
          >
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="font-bold text-sm text-gray-900 mb-1">{c.label}</p>
            <p className="text-2xl font-extrabold text-indigo-600 mb-1">
              {c.gpa}+
            </p>
            <p className="text-xs text-gray-500">min GPA required</p>
            <p className="text-xs text-gray-400 mt-2">{c.credits}</p>
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.color}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function BscSpecialSelectionContent() {
  return (
    <div className="space-y-3">
      <InfoCard>
        <p className="font-medium">
          BSc Special Degree - Selection Requirements
        </p>
      </InfoCard>
      <RequirementList
        items={[
          {
            text: "Must have registered for at least 60 Credits.",
          },
          {
            text: 'Must have at least a C grade for 60% of the Credits in the relevant subjects (Theory).',
          },
          {
            text: 'Must have at least a C- grade for all Practical Course Units of the subject applied for the Special Degree.',
          },
          {
            text: 'For other Practical Course Units: D+ (Optional), C- (Core) minimum required.',
          },
          { text: "Must maintain a minimum GPA of 2.00." },
          {
            text: 'Must have at least a B- grade for 80% of all Course Units in the subject applied for the Special Degree.',
          },
          { text: "Must have passed English Level I & II." },
        ]}
      />
    </div>
  );
}

function BscGeneralContent() {
  return (
    <div className="space-y-3">
      <InfoCard>
        <p className="font-medium">
          BSc General Degree - Completion Requirements
        </p>
      </InfoCard>
      <RequirementList
        items={[
          {
            text: "Must have registered for at least 90 Credits.",
          },
          {
            text: 'Must have at least a C grade for 60% of Core Courses (Theory).',
          },
          {
            text: 'Must have at least a D+ grade for 60% of Optional Course Units.',
          },
          {
            text: 'Must have at least a C- grade for all Core Course Unit Practicals.',
          },
          { text: "Must maintain a minimum GPA of 2.00." },
          { text: "Must have passed English Level I & II." },
          {
            text: "Biological Science students must have passed Mathematics for Biology.",
          },
          {
            text: "Students not taking Computer Science as a subject must pass CLC (Computer Literacy Course).",
          },
        ]}
      />
    </div>
  );
}

function BscSpecialCompletionContent() {
  return (
    <div className="space-y-3">
      <InfoCard>
        <p className="font-medium">
          BSc Special Degree - Completion Requirements
        </p>
      </InfoCard>
      <RequirementList
        items={[
          { text: "Must maintain a minimum Overall GPA of 2.00." },
          {
            text: "Regarding the Specialization Subject: Must register for a minimum of 52 Credits.",
          },
          {
            text: 'Must have at least a C grade for 60% of those Credits (Theory).',
          },
          {
            text: 'Must have at least a C- grade for all Practicals.',
          },
          {
            text: "Must have at least a Pass (C) for the Research Project, Industrial/Practical Training, and Additional Skills (Seminar, Essay, etc.).",
          },
          { text: "The GPA for the specialization subject must be at least 2.00." },
          {
            text: 'Must have at least a C grade for the Individual Research Project.',
          },
          {
            text: 'Must have at least a C grade for 70% of the 4th-year Course Units.',
          },
          { text: "Must have passed English Level I, II, & III." },
          {
            text: "Biological Science students must have passed Mathematics for Biology.",
          },
          {
            text: "Students not taking Computer Science as a subject must pass CLC.",
          },
        ]}
      />
    </div>
  );
}

function BcsSpecialSelectionContent() {
  return (
    <div className="space-y-3">
      <InfoCard>
        <p className="font-medium">
          BCS Special Degree - Selection Requirements
        </p>
      </InfoCard>
      <RequirementList
        items={[
          {
            text: "Must have registered for at least 90 Credits.",
          },
          {
            text: 'Must have at least a B- grade for 80% of CS (Computer Science) Course Units.',
          },
          {
            text: 'Must have at least a C grade for 60% of Maths Course Units.',
          },
          {
            text: 'Must have at least a C grade for the Industry Placement Course Unit.',
          },
          { text: "Must maintain a minimum GPA of 2.00." },
          { text: "Must have passed English Level I & II." },
        ]}
      />
    </div>
  );
}

function BcsGeneralContent() {
  return (
    <div className="space-y-3">
      <InfoCard>
        <p className="font-medium">
          BCS General Degree - Completion Requirements
        </p>
      </InfoCard>
      <RequirementList
        items={[
          {
            text: "Must have registered for at least 90 Credits.",
          },
          {
            text: 'Must have at least a C grade for 60% of CS Core Subjects.',
          },
          {
            text: 'Must have at least a C grade for 60% of Maths Core Subjects.',
          },
          {
            text: 'Must have at least a C grade for 60% of Optional Course Units.',
          },
          {
            text: 'Must have at least a C grade for the Industry Placement Course Unit.',
          },
          { text: "Must have passed English Level I & II." },
        ]}
      />
    </div>
  );
}

function BcsSpecialCompletionContent() {
  return (
    <div className="space-y-3">
      <InfoCard>
        <p className="font-medium">
          BCS Special Degree - Completion Requirements
        </p>
      </InfoCard>
      <RequirementList
        items={[
          {
            text: "Must have registered for at least 120 Credits (including 30 Credits in the 4th year).",
          },
          { text: "Must maintain a minimum GPA of 2.50." },
          {
            text: 'Must have at least a C grade for the Individual Research Project.',
          },
          {
            text: 'Must have at least a C grade for 70% of the 4th-year Course Units.',
          },
          { text: "Must have passed English Level I, II, & III." },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Build Sections Array
// ---------------------------------------------------------------------------

const sections: Section[] = [
  {
    id: "departments",
    title: "Departments",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    content: <DepartmentsContent />,
  },
  {
    id: "slqf",
    title: "SLQF - Sri Lankan Qualification Framework",
    icon: Layers,
    color: "from-indigo-500 to-purple-600",
    content: <SlqfContent />,
  },
  {
    id: "semester",
    title: "Semester Structure",
    icon: Clock,
    color: "from-emerald-500 to-teal-600",
    content: <SemesterContent />,
  },
  {
    id: "credits",
    title: "Credit System",
    icon: Hash,
    color: "from-amber-500 to-orange-600",
    content: <CreditsContent />,
  },
  {
    id: "course-units",
    title: "Course Units & Codes",
    icon: BookOpen,
    color: "from-purple-500 to-violet-600",
    content: <CourseUnitsContent />,
  },
  {
    id: "gpa-calculation",
    title: "How to Calculate GPA",
    icon: Calculator,
    color: "from-rose-500 to-pink-600",
    content: <GpaCalculationContent />,
  },
  {
    id: "bsc-special-selection",
    title: "BSc Special Degree - Selection",
    icon: Target,
    color: "from-blue-500 to-cyan-600",
    content: <BscSpecialSelectionContent />,
  },
  {
    id: "bsc-general",
    title: "BSc General Degree - Completion",
    icon: GraduationCap,
    color: "from-green-500 to-emerald-600",
    content: <BscGeneralContent />,
  },
  {
    id: "bsc-special-completion",
    title: "BSc Special Degree - Completion",
    icon: Award,
    color: "from-indigo-500 to-blue-600",
    content: <BscSpecialCompletionContent />,
  },
  {
    id: "bcs-special-selection",
    title: "BCS Special Degree - Selection",
    icon: Target,
    color: "from-violet-500 to-purple-600",
    content: <BcsSpecialSelectionContent />,
  },
  {
    id: "bcs-general",
    title: "BCS General Degree - Completion",
    icon: GraduationCap,
    color: "from-teal-500 to-green-600",
    content: <BcsGeneralContent />,
  },
  {
    id: "bcs-special-completion",
    title: "BCS Special Degree - Completion",
    icon: Award,
    color: "from-sky-500 to-blue-600",
    content: <BcsSpecialCompletionContent />,
  },
  {
    id: "grades",
    title: "Grades & Grade Point Values",
    icon: FileText,
    color: "from-orange-500 to-red-600",
    content: <GradesContent />,
  },
  {
    id: "honors",
    title: "Honours Degree Classification",
    icon: Trophy,
    color: "from-amber-500 to-yellow-600",
    content: <HonorsContent />,
  },
];

// ---------------------------------------------------------------------------
// Collapsible Section Component
// ---------------------------------------------------------------------------

function CollapsibleSection({
  section,
  isOpen,
  onToggle,
}: {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <section.icon className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="flex-1 text-sm font-semibold text-gray-900">
          {section.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{section.content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AcademicGuide() {
  const { session, username, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileImage] = useState<string | null>(() =>
    getProfileImage(username)
  );
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Data for degree progress — seed from centralized cache for instant render
  const [results, setResults] = useState<GpaResults | null>(() => {
    if (!username) return null;
    return getCached<GpaResults>(CACHE_KEYS.results(username, "4"));
  });
  const [courseData, setCourseData] = useState<CourseRegistrationData | null>(
    () => getCached<CourseRegistrationData>(CACHE_KEYS.courseReg)
  );
  const [progressLoading, setProgressLoading] = useState(
    // If we already have cached data, skip the loading spinner
    () => !results
  );
  const fetchedRef = useRef(false);

  const loadProgressData = useCallback(async () => {
    if (!session || !username) return;
    if (!results) setProgressLoading(true);
    try {
      // Both use centralized cache + dedup — instant if already fetched
      const [resData, courseRegData] = await Promise.allSettled([
        fetchResults(session, username, "4"),
        fetchCourseRegistration(session),
      ]);
      if (resData.status === "fulfilled") setResults(resData.value);
      if (courseRegData.status === "fulfilled") setCourseData(courseRegData.value);
    } catch {
      // Silent - progress section just won't show
    } finally {
      setProgressLoading(false);
    }
  }, [session, username, results]);

  useEffect(() => {
    if (!session || fetchedRef.current) return;
    fetchedRef.current = true;
    loadProgressData();
  }, [session, loadProgressData]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenSections(new Set(sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  // Group sections by category for better organization
  const generalInfo = sections.filter((s) =>
    ["departments", "slqf", "semester", "credits", "course-units"].includes(
      s.id
    )
  );
  const gpaAndGrades = sections.filter((s) =>
    ["gpa-calculation", "grades", "honors"].includes(s.id)
  );
  const degreeRequirements = sections.filter((s) =>
    [
      "bsc-special-selection",
      "bsc-general",
      "bsc-special-completion",
      "bcs-special-selection",
      "bcs-general",
      "bcs-special-completion",
    ].includes(s.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        username={username}
        profileImage={profileImage}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Academic Guide</h1>
              <p className="text-indigo-200 text-sm">
                Faculty of Science, University of Ruhuna
              </p>
            </div>
          </div>
          <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
            Complete reference for degree programs, credit system, grading
            scale, GPA calculation, and degree completion requirements. All
            information is based on the Faculty of Science guidelines.
          </p>
        </motion.div>

        {/* Degree Progress - THE MOST IMPORTANT SECTION */}
        <DegreeProgress
          results={results}
          courseData={courseData}
          loading={progressLoading}
        />

        {/* General Information */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            General Information
          </h2>
          <div className="space-y-3">
            {generalInfo.map((section) => (
              <CollapsibleSection
                key={section.id}
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>

        {/* GPA & Grades */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            GPA & Grades
          </h2>
          <div className="space-y-3">
            {gpaAndGrades.map((section) => (
              <CollapsibleSection
                key={section.id}
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>

        {/* Degree Requirements */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Degree Requirements
          </h2>
          <div className="space-y-3">
            {degreeRequirements.map((section) => (
              <CollapsibleSection
                key={section.id}
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}
