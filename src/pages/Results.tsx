import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import { fetchResults, calculateGPA } from "../services/api";
import { getProfileImage } from "../services/dataCache";
import type { GpaFormData, GpaResults, RepeatedSubject } from "../types";

// Layout
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardFooter from "../components/dashboard/DashboardFooter";

// Existing sections
import GpaOverview from "../components/dashboard/GpaOverview";
import ResultsTable from "../components/dashboard/ResultsTable";
import GpaCalculator from "../components/dashboard/GpaCalculator";
import RepeatedSubjects from "../components/dashboard/RepeatedSubjects";

// New analytics & planning
import ClassPredictor from "../components/dashboard/ClassPredictor";
import CreditProgress from "../components/dashboard/CreditProgress";
import GpaTrendChart from "../components/dashboard/GpaTrendChart";
import GradeDistribution from "../components/dashboard/GradeDistribution";
import DepartmentRadar from "../components/dashboard/DepartmentRadar";
import AnalyticsTabs from "../components/dashboard/AnalyticsTabs";
import WhatIfSimulator from "../components/dashboard/WhatIfSimulator";
import GpaTargetPlanner from "../components/dashboard/GpaTargetPlanner";
import ExcelExport from "../components/dashboard/ExcelExport";

export default function Results() {
  const { signOut, username, session, consumeInitialResults } = useAuth();
  const [rlevel, setRlevel] = useState("4");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GpaResults | null>(null);
  const [gpaFormData, setGpaFormData] = useState<GpaFormData>({
    stnum: username || "",
    manualSubjects: { subjects: [""], grades: [""] },
    repeatedSubjects: { subjects: [], grades: [] },
  });
  // Profile image: resolved once from cache / localStorage
  const [profileImage] = useState<string | null>(() =>
    getProfileImage(username)
  );
  const [repeatedSubjects, setRepeatedSubjects] = useState<RepeatedSubject[]>(
    []
  );
  const [editableGrades, setEditableGrades] = useState<
    Record<string, string>
  >({});
  const [includeRepeated, setIncludeRepeated] = useState(true);

  const gpaOverviewRef = useRef<HTMLDivElement>(null);
  // Tracks whether the initial prefetch has been applied.
  const prefetchApplied = useRef(false);
  const prevRlevel = useRef(rlevel);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  /** Apply fetched/cached result data to component state. */
  const applyResults = useCallback(
    (data: GpaResults) => {
      setResults(data);

      if (data.repeatedSubjects) {
        setRepeatedSubjects(data.repeatedSubjects);
        const initialGrades: Record<string, string> = {};
        data.repeatedSubjects.forEach((subject: RepeatedSubject) => {
          initialGrades[subject.subjectCode] = subject.latestAttempt.grade;
        });
        setEditableGrades(initialGrades);
      }
    },
    []
  );

  const loadResults = useCallback(
    async () => {
      if (!username || !session) return;
      setLoading(true);

      try {
        // fetchResults uses the centralized cache + dedup internally
        const data = await fetchResults(session, username, rlevel);
        applyResults(data);
      } catch {
        toast.error("Error fetching results");
      } finally {
        setLoading(false);
      }
    },
    [username, session, rlevel, applyResults]
  );

  useEffect(() => {
    if (!username || !session) return;

    // If rlevel changed, clear the prefetch flag so we fetch fresh data
    if (prevRlevel.current !== rlevel) {
      prevRlevel.current = rlevel;
      prefetchApplied.current = false;
    }

    // On first load after login, use pre-fetched results (instant render).
    if (!prefetchApplied.current) {
      const prefetched = consumeInitialResults();
      if (prefetched) {
        prefetchApplied.current = true;
        applyResults(prefetched);
        return;
      }
    }
    if (prefetchApplied.current) return; // StrictMode 2nd mount — skip

    loadResults();
  }, [loadResults, username, session, rlevel, consumeInitialResults, applyResults]);

  useEffect(() => {
    setGpaFormData((prev) => ({ ...prev, stnum: username || "" }));
  }, [username]);

  const handleGradeChange = (subjectCode: string, grade: string) => {
    setEditableGrades((prev) => ({ ...prev, [subjectCode]: grade }));
  };

  const handleGpaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredManual = {
      subjects: gpaFormData.manualSubjects.subjects.filter(
        (s) => s.trim() !== ""
      ),
      grades: gpaFormData.manualSubjects.grades.filter(
        (g, i) =>
          g.trim() !== "" &&
          gpaFormData.manualSubjects.subjects[i].trim() !== ""
      ),
    };

    const filteredRepeated =
      includeRepeated && repeatedSubjects.length > 0
        ? {
            subjects: repeatedSubjects.map((s) => s.subjectCode),
            grades: repeatedSubjects.map(
              (s) => editableGrades[s.subjectCode]
            ),
          }
        : { subjects: [], grades: [] };

    if (
      filteredManual.subjects.length === 0 &&
      filteredRepeated.subjects.length === 0
    ) {
      toast.error("Please enter at least one subject and grade");
      return;
    }

    try {
      const data = await calculateGPA(
        session || "",
        username ?? "",
        filteredManual,
        filteredRepeated
      );
      setResults(data);
      toast.success("GPA calculated successfully!");
      setTimeout(() => {
        gpaOverviewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      toast.error("Error calculating GPA");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        username={username}
        profileImage={profileImage}
        onSignOut={handleSignOut}
        actions={
          <ExcelExport
            subjectBreakdown={results?.subjectBreakdown}
            username={username}
            gpa={results?.gpa}
          />
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {results?.message === "Rest in Peace" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-red-600 space-y-2"
          >
            <h3 className="text-xl font-bold">Rest in Heaven</h3>
            <p>
              Our hearts are heavy with sorrow as we remember a beloved
              student who is no longer with us. May their soul find eternal
              peace, and may their memory live on in the hearts of all who
              knew and loved them.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Class Predictor banner */}
            {results && <ClassPredictor gpa={results.gpa} />}

            {/* GPA Overview gauges */}
            <div ref={gpaOverviewRef}>
              {results && <GpaOverview results={results} />}
            </div>

            {/* Credit Progress */}
            {results && (
              <CreditProgress
                totalCredits={results.totalCredits}
                confirmedCredits={results.confirmedCredits}
              />
            )}

            {/* Analytics Grid */}
            {results && (
              <div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                style={{ contentVisibility: "auto" }}
              >
                <GpaTrendChart levelGpas={results.levelGpas} />
                <GradeDistribution
                  distribution={results.gradeDistribution}
                />
              </div>
            )}

            {/* Department Radar - full width */}
            {results && (
              <div style={{ contentVisibility: "auto" }}>
                <DepartmentRadar results={results} />
              </div>
            )}

            {/* Results Table */}
            <ResultsTable
              html={results?.data}
              rlevel={rlevel}
              onRlevelChange={setRlevel}
              onRefresh={() => loadResults()}
              loading={loading}
            />

            {/* Tabbed: Calculator / What-If / Target Planner */}
            <AnalyticsTabs
              calculatorContent={
                <GpaCalculator
                  gpaFormData={gpaFormData}
                  setGpaFormData={setGpaFormData}
                  onSubmit={handleGpaSubmit}
                />
              }
              whatIfContent={
                <WhatIfSimulator
                  totalCredits={results?.totalCredits}
                  totalGradePoints={results?.totalGradePoints}
                />
              }
              targetContent={
                <GpaTargetPlanner
                  totalCredits={results?.totalCredits}
                  totalGradePoints={results?.totalGradePoints}
                />
              }
            />

            {/* Repeated Subjects */}
            <RepeatedSubjects
              repeatedSubjects={repeatedSubjects}
              editableGrades={editableGrades}
              includeRepeated={includeRepeated}
              onGradeChange={handleGradeChange}
              onIncludeChange={setIncludeRepeated}
            />
          </>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
}
