import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LogOut,
  GraduationCap,
  Plus,
  Trash2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import { fetchResults, calculateGPA } from "../services/api";
import { GRADE_SCALE, GRADE_OPTIONS, GPA_LABELS } from "../constants/grades";
import type { GpaFormData, GpaResults, RepeatedSubject } from "../types";

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
  const [editableGrades, setEditableGrades] = useState<Record<string, string>>(
    {}
  );
  const [includeRepeated, setIncludeRepeated] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Error signing out");
    }
  };

  // Core fetch logic extracted so it can be called from both the form and
  // the initial-load effect without needing a synthetic event.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadResults();
  };

  // Fetch results on initial mount
  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGpaFormData((prev) => ({ ...prev, stnum: username || "" }));
  }, [username]);

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
    } catch {
      toast.error("Error calculating GPA");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-indigo-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Student Results Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {profileImage && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src={profileImage}
                    alt="Student Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white shadow sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Get Student Results
              </h2>
              <p className="mt-1 text-sm text-gray-500">{username}</p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="rlevel"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Result Level
                  </label>
                  <select
                    id="rlevel"
                    value={rlevel}
                    onChange={(e) => setRlevel(e.target.value)}
                    className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                  >
                    <option value="4">All</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Show Results"}
                </motion.button>
              </form>

              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  {results.message === "Rest in Peace" ? (
                    <div className="text-center text-red-600 space-y-2">
                      <h3 className="text-xl font-bold">Rest in Heaven</h3>
                      <p>
                        Our hearts are heavy with sorrow as we remember a
                        beloved student who is no longer with us. May their soul
                        find eternal peace, and may their memory live on in the
                        hearts of all who knew and loved them.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="results-container">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: results.data || "",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(GPA_LABELS).map(([key, label]) => {
                          const value =
                            results[key as keyof GpaResults] as string;
                          if (!value || isNaN(Number(value))) return null;
                          return (
                            <div
                              key={key}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <h3 className="text-sm font-medium text-gray-500">
                                {label}
                              </h3>
                              <p className="mt-1 text-2xl font-semibold text-indigo-600">
                                {value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* GPA Calculator Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">
                GPA Calculator
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter new subjects and/or update repeated subjects to calculate
                your GPA
              </p>
              <ol className="list-decimal pl-5 text-sm text-gray-500 mt-2 font-bold">
                <li>
                  FOSMIS එකේ නැති Results තියෙනවනම් Add New Subjects වල Sbuject
                  code & results add කරලා බලන්න.
                </li>
                <li>
                  FOSMIS එකේ නැති subjects සහ repeated & MC subjects වල results
                  වෙනස් කරලා GPA එක බලන්න ඕන නම් "include in calculation" tick
                  එක දාල results වෙනස් කරලා බලන්න
                </li>
                <li>
                  Repeated & MC sbujects වල results විතරක් වෙනස් කරලා GPA එක
                  බලන්න ඕන නම් "include in calculation" tick එක දාල results
                  change කරලා "Calculatte GPA " button එක click කරන්න{" "}
                </li>
              </ol>

              <form onSubmit={handleGpaSubmit} className="mt-5 space-y-6">
                {/* Manual Subject Entry */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    Add New Subjects
                  </h3>
                  <p className="text-sm text-red-500 mb-3">
                    When entering subject codes enter 'a' for 'α', 'b' for 'β',
                    'd' for 'δ'
                  </p>

                  {gpaFormData.manualSubjects.subjects.map((subject, index) => (
                    <div key={index} className="flex gap-4 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Subject Code"
                          value={subject}
                          onChange={(e) => {
                            const newSubjects = [
                              ...gpaFormData.manualSubjects.subjects,
                            ];
                            newSubjects[index] = e.target.value;
                            setGpaFormData((prev) => ({
                              ...prev,
                              manualSubjects: {
                                ...prev.manualSubjects,
                                subjects: newSubjects,
                              },
                            }));
                          }}
                          className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Grade (e.g. A+)"
                          value={gpaFormData.manualSubjects.grades[index]}
                          onChange={(e) => {
                            const newGrades = [
                              ...gpaFormData.manualSubjects.grades,
                            ];
                            newGrades[index] = e.target.value;
                            setGpaFormData((prev) => ({
                              ...prev,
                              manualSubjects: {
                                ...prev.manualSubjects,
                                grades: newGrades,
                              },
                            }));
                          }}
                          className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                        />
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeSubjectField(index)}
                          className="mt-1 p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div>
                    <button
                      type="button"
                      onClick={addSubjectField}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Subject
                    </button>
                  </div>
                </div>

                {/* Repeated Subjects */}
                {repeatedSubjects.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <h3 className="text-md font-medium text-gray-900 mr-3">
                        Update Repeated Subjects
                      </h3>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={includeRepeated}
                          onChange={(e) => setIncludeRepeated(e.target.checked)}
                          className="rounded text-indigo-600 shadow-sm"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Include in calculation
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {repeatedSubjects.map((subject) => (
                        <div
                          key={subject.subjectCode}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-md font-medium text-gray-900">
                                  {subject.subjectName} ({subject.subjectCode})
                                </h4>
                                <div className="mt-1 text-sm text-gray-500">
                                  <p>Attempts:</p>
                                  <ul className="list-disc pl-5">
                                    {subject.attempts.map((attempt, index) => (
                                      <li key={index}>
                                        {attempt.grade} ({attempt.year}){" "}
                                        {attempt.isLowGrade && (
                                          <span className="text-red-500">
                                            (Low Grade)
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <select
                                  value={
                                    editableGrades[subject.subjectCode] ||
                                    subject.latestAttempt.grade
                                  }
                                  onChange={(e) =>
                                    handleGradeChange(
                                      subject.subjectCode,
                                      e.target.value
                                    )
                                  }
                                  className="block w-full rounded-md shadow-sm sm:text-sm"
                                  disabled={!includeRepeated}
                                >
                                  {GRADE_OPTIONS.map((grade) => (
                                    <option key={grade} value={grade}>
                                      {grade}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {subject.attempts.length > 1 && (
                              <div className="mt-auto pt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-indigo-600 h-2.5 rounded-full"
                                    style={{
                                      width: `${
                                        ((GRADE_SCALE[
                                          editableGrades[
                                            subject.subjectCode
                                          ] || subject.latestAttempt.grade
                                        ] ?? 0) /
                                          4) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Current Grade Value:{" "}
                                  {GRADE_SCALE[
                                    editableGrades[subject.subjectCode] ||
                                      subject.latestAttempt.grade
                                  ] ?? 0}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Calculate GPA
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Alerts */}
        <div className="space-y-4 mt-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Response times may be slower as our server is hosted on a free
                  platform. Thank you for your patience!
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 border-l-4 border-blue-400 p-4"
          >
            <div className="flex">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  If you want to remove your results from this system, please
                  contact me through{" "}
                  <a
                    href="https://wa.me/94768324613"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    WhatsApp.
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="bg-indigo-600 mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-white">
            Developed and maintained by Isuru Shanaka, Department of Computer
            Science
          </p>
        </div>
      </footer>
    </div>
  );
}
