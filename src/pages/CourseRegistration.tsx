import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BookOpen,
  ChevronDown,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchCourseRegistration } from "../services/api";
import { getProfileImage, getCached, CACHE_KEYS } from "../services/dataCache";
import type { CourseRegistrationData, RegisteredCourse } from "../types";
import { DEGREE_CREDIT_TARGETS } from "../constants/grades";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardFooter from "../components/dashboard/DashboardFooter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract year from a course code (first digit after letter prefix). */
function extractYear(code: string): number {
  const digits = code.replace(/^[A-Za-z]+/, "");
  return parseInt(digits[0], 10) || 0;
}

/** Group courses by year derived from subject code. */
function groupByYear(courses: RegisteredCourse[]) {
  const map: Record<number, RegisteredCourse[]> = {};
  for (const c of courses) {
    const yr = extractYear(c.code);
    if (!map[yr]) map[yr] = [];
    map[yr].push(c);
  }
  return Object.entries(map)
    .map(([year, items]) => ({ year: Number(year), courses: items }))
    .sort((a, b) => a.year - b.year);
}

/** Get credit from code's last char (mirrors backend logic). */
function getCreditFromCode(code: string): number {
  const CREDIT_MAP: Record<string, number> = {
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
    "\u03B1": 1.5, "\u03B2": 2.5, "\u03B4": 1.25,
    a: 1.5, b: 2.5, d: 1.25,
  };
  const last = code.slice(-1);
  return CREDIT_MAP[last] ?? 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CourseRegistration() {
  const { session, username, signOut } = useAuth();
  const navigate = useNavigate();
  // Seed from centralized cache for instant render
  const [data, setData] = useState<CourseRegistrationData | null>(
    () => getCached<CourseRegistrationData>(CACHE_KEYS.courseReg)
  );
  const [loading, setLoading] = useState(() => !data);
  const [degreeIdx, setDegreeIdx] = useState(0);
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());
  const fetchedRef = useRef(false);
  const [profileImage] = useState<string | null>(() =>
    getProfileImage(username)
  );

  const handleSignOut = async () => {
    try { await signOut(); } catch { toast.error("Error signing out"); }
  };

  const loadData = useCallback(async () => {
    if (!session) return;
    if (!data) setLoading(true);
    try {
      // Uses centralized cache + dedup internally
      const resp = await fetchCourseRegistration(session);
      setData(resp);
    } catch {
      toast.error("Error loading course registration");
    } finally {
      setLoading(false);
    }
  }, [session, data]);

  useEffect(() => {
    if (!session || fetchedRef.current) return;
    fetchedRef.current = true;
    loadData();
  }, [session, loadData]);

  // Auto-expand all years once data loads
  useEffect(() => {
    if (data?.allCourses) {
      const years = new Set(data.allCourses.map((c) => extractYear(c.code)));
      setOpenYears(years);
    }
  }, [data]);

  const toggleYear = (yr: number) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(yr)) next.delete(yr);
      else next.add(yr);
      return next;
    });
  };

  const nonDegreeSet = new Set(
    (data?.nonDegreeSubjects ?? []).map((s) => s.toUpperCase())
  );

  // Credit progress
  const confirmedCredits = data?.totalConfirmedCredits ?? 0;
  const target = DEGREE_CREDIT_TARGETS[degreeIdx].credits;
  const pct = Math.min((confirmedCredits / target) * 100, 100);
  const remaining = Math.max(target - confirmedCredits, 0);
  const barColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  const yearGroups = data ? groupByYear(data.allCourses) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        username={username}
        profileImage={profileImage}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/home")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* ---- Summary Cards ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Confirmed Credits */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Total Confirmed Credits
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {confirmedCredits}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  across {data.allCourses.length} courses
                </p>
              </motion.div>

              {/* Current Semester */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Current Semester
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.currentSemester.credits}
                  <span className="text-base font-normal text-gray-400 ml-1">credits</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.currentSemester.academicYear
                    ? `${data.currentSemester.academicYear} · Semester ${data.currentSemester.semester}`
                    : `${data.currentSemester.courses.length} courses registered`}
                </p>
              </motion.div>

              {/* Departments */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Departments
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.departments.length > 0 ? (
                    data.departments.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium"
                      >
                        {d.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ---- Credit Progress ---- */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4 sm:px-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Credit Progress
                  </h3>
                </div>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {DEGREE_CREDIT_TARGETS.map((dt, idx) => (
                    <button
                      key={dt.label}
                      onClick={() => setDegreeIdx(idx)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        degreeIdx === idx
                          ? "bg-indigo-600 text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className={`h-full rounded-full ${barColor}`}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                  {confirmedCredits} / {target} credits ({pct.toFixed(0)}%)
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {remaining > 0
                  ? `${remaining} credits remaining to complete your degree`
                  : "You have completed all required credits!"}
              </p>
            </motion.div>

            {/* ---- Current Semester Table ---- */}
            {data.currentSemester.courses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Current Semester
                    {data.currentSemester.academicYear && (
                      <span className="ml-2 text-indigo-600 normal-case">
                        {data.currentSemester.academicYear} · Semester{" "}
                        {data.currentSemester.semester}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <th className="px-5 py-2.5 text-left font-medium">Code</th>
                        <th className="px-5 py-2.5 text-left font-medium">Course Name</th>
                        <th className="px-5 py-2.5 text-center font-medium">Credits</th>
                        <th className="px-5 py-2.5 text-center font-medium">Status</th>
                        <th className="px-5 py-2.5 text-center font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.currentSemester.courses.map((c) => (
                        <CourseRow
                          key={c.code}
                          course={c}
                          isNonDegree={nonDegreeSet.has(c.code.toUpperCase())}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ---- All Courses (grouped by year) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  All Registered Courses
                  <span className="ml-2 text-gray-300 normal-case font-normal">
                    ({data.allCourses.length} courses)
                  </span>
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {yearGroups.map(({ year, courses }) => (
                  <div key={year}>
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                          L{year}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          Level {year}
                        </span>
                        <span className="text-xs text-gray-400">
                          {courses.length} course{courses.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: openYears.has(year) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openYears.has(year) && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50/70 text-xs text-gray-500 uppercase">
                                  <th className="px-5 py-2 text-left font-medium">Code</th>
                                  <th className="px-5 py-2 text-left font-medium">Course Name</th>
                                  <th className="px-5 py-2 text-center font-medium">Credits</th>
                                  <th className="px-5 py-2 text-center font-medium">Status</th>
                                  <th className="px-5 py-2 text-center font-medium">Type</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {courses.map((c) => (
                                  <CourseRow
                                    key={c.code}
                                    course={c}
                                    isNonDegree={nonDegreeSet.has(
                                      c.code.toUpperCase()
                                    )}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No course registration data available.
          </div>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: a single course table row
// ---------------------------------------------------------------------------

function CourseRow({
  course,
  isNonDegree,
}: {
  course: RegisteredCourse;
  isNonDegree: boolean;
}) {
  const credit = getCreditFromCode(course.code);
  const isConfirmed = course.confirmation.toLowerCase().includes("confirmed");

  return (
    <tr
      className={`hover:bg-gray-50/50 transition-colors ${
        isNonDegree ? "bg-amber-50/40" : ""
      }`}
    >
      <td className="px-5 py-2.5 font-mono text-xs font-semibold text-gray-700">
        {course.code}
      </td>
      <td className="px-5 py-2.5 text-gray-700">{course.name}</td>
      <td className="px-5 py-2.5 text-center text-gray-600 font-medium">
        {credit > 0 ? credit : "—"}
      </td>
      <td className="px-5 py-2.5 text-center">
        {isConfirmed ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {course.confirmation || "Pending"}
          </span>
        )}
      </td>
      <td className="px-5 py-2.5 text-center">
        {isNonDegree ? (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            Non Degree
          </span>
        ) : (
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Degree
          </span>
        )}
      </td>
    </tr>
  );
}
