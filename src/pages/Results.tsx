import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import { fetchResults, calculateGPA } from "../services/api";
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
import PdfExport from "../components/dashboard/PdfExport";

export default function Results() {
  const { signOut, username, session } = useAuth();
  const [rlevel, setRlevel] = useState("4");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GpaResults | null>(null);
  const [gpaFormData, setGpaFormData] = useState<GpaFormData>({
    stnum: username || "",
    manualSubjects: { subjects: [""], grades: [""] },
    repeatedSubjects: { subjects: [], grades: [] },
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [repeatedSubjects, setRepeatedSubjects] = useState<RepeatedSubject[]>(
    []
  );
  const [editableGrades, setEditableGrades] = useState<
    Record<string, string>
  >({});
  const [includeRepeated, setIncludeRepeated] = useState(true);

  const gpaOverviewRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  const loadResults = useCallback(async () => {
    if (!username || !session) return;
    setLoading(true);
    try {
      setProfileImage(
        `https://paravi.ruh.ac.lk/rumis/picture/user_pictures/student_std_pics/fosmis_pic/sc${username}.jpg`
      );

      const data = await fetchResults(session, username, rlevel);
      setResults(data);

      if (data.repeatedSubjects) {
        setRepeatedSubjects(data.repeatedSubjects);
        const initialGrades: Record<string, string> = {};
        data.repeatedSubjects.forEach((subject: RepeatedSubject) => {
          initialGrades[subject.subjectCode] = subject.latestAttempt.grade;
        });
        setEditableGrades(initialGrades);
      }
    } catch {
      toast.error("Error fetching results");
    } finally {
      setLoading(false);
    }
  }, [username, session, rlevel]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

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
          <PdfExport
            contentRef={pdfContentRef as React.RefObject<HTMLDivElement>}
            username={username}
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
            {/* PDF-capturable section */}
            <div ref={pdfContentRef} className="space-y-6">
              {/* Class Predictor banner */}
              {results && <ClassPredictor gpa={results.gpa} />}

              {/* GPA Overview gauges */}
              <div ref={gpaOverviewRef}>
                {results && <GpaOverview results={results} />}
              </div>

              {/* Credit Progress */}
              {results && (
                <CreditProgress totalCredits={results.totalCredits} />
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
            </div>

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
