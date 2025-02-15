import React, { useEffect, useState } from "react";
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

interface GpaFormData {
  studentNumber: string;
  subjects: string[];
  grades: string[];
}

interface RankData {
  totalCount: number;
  rank: number;
  highestGpa: number;
  lowestGpa: number;
  averageGpa: number;
}

export default function Results() {
  const { signOut, username } = useAuth();
  const [stnum, setStnum] = useState("");
  const [rlevel, setRlevel] = useState("4");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [gpaFormData, setGpaFormData] = useState<GpaFormData>({
    studentNumber: "",
    subjects: [""],
    grades: [""],
  });
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [rankForm, setRankForm] = useState({
    startnum: "",
    endnum: "",
    stnumrank: "",
    gpatype: "gpa",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = `https://paravi.ruh.ac.lk/rumis/picture/user_pictures/student_std_pics/fosmis_pic/sc${username}.jpg`;
      setProfileImage(imageUrl);
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL
        }/results?stnum=${username}&rlevel=${rlevel}`,
        {
          headers: {
            authorization: localStorage.getItem("PHPSESSID") || "",
          },
          credentials: "include",
        }
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      toast.error("Error fetching results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  }, []);

  const addSubjectField = () => {
    setGpaFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, ""],
      grades: [...prev.grades, ""],
    }));
  };

  const removeSubjectField = (index: number) => {
    setGpaFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
      grades: prev.grades.filter((_, i) => i !== index),
    }));
  };

  const handleGpaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/calculateGPA", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gpaFormData),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      toast.error("Error calculating GPA");
    }
  };

  const handleRankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/calculateRank?startnum=${rankForm.startnum}&endnum=${rankForm.endnum}&stnum=${rankForm.stnumrank}&gpatype=${rankForm.gpatype}`
      );
      const data = await response.json();
      setRankData(data);
    } catch (error) {
      toast.error("Error calculating rank");
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
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        <div className="mb-8 space-y-4">
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
                    WhatsApp
                  </a>
                  .
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Profile Image Card */}
        {profileImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex justify-center"
          >
            <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-lg border-4 border-white ring-2 ring-indigo-500">
              <img
                src={profileImage}
                alt="Student Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/150?text=No+Image";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-center text-white text-sm font-medium">
                SC/{stnum}
              </div>
            </div>
          </motion.div>
        )}

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
                    htmlFor="stnum"
                    className="hidden  text-sm font-medium text-gray-700"
                  >
                    Student Number
                  </label>
                  <input
                    type="number"
                    id="stnum"
                    value={stnum}
                    onChange={(e) => setStnum(e.target.value)}
                    className="hidden mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                      <div dangerouslySetInnerHTML={{ __html: results.data }} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries({
                          "Overall GPA": results.gpa,
                          "Math GPA": results.mathGpa,
                          "Chemistry GPA": results.cheGpa,
                          "Physics GPA": results.phyGpa,
                          "Zoology GPA": results.zooGpa,
                          "Botany GPA": results.botGpa,
                          "Computer Science GPA": results.csGpa,
                        }).map(
                          ([label, value]) =>
                            value &&
                            !isNaN(Number(value)) && (
                              <div
                                key={label}
                                className="bg-gray-50 p-4 rounded-lg"
                              >
                                <h3 className="text-sm font-medium text-gray-500">
                                  {label}
                                </h3>
                                <p className="mt-1 text-2xl font-semibold text-indigo-600">
                                  {value}
                                </p>
                              </div>
                            )
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* GPA Calculator Section */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Check GPA with Updated Results
              </h2>
              <p className="mt-1 text-sm text-red-500">
                When entering subject codes enter 'a' for 'α', 'b' for 'β', 'd'
                for 'δ'
              </p>

              <form onSubmit={handleGpaSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="studentNumber"
                    className="hidden text-sm font-medium text-gray-700"
                  >
                    Student Number
                  </label>
                  <input
                    type="number"
                    id="studentNumber"
                    value={gpaFormData.studentNumber}
                    onChange={(e) =>
                      setGpaFormData((prev) => ({
                        ...prev,
                        studentNumber: e.target.value,
                      }))
                    }
                    className="mt-1 hidden w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {gpaFormData.subjects.map((subject, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Subject Code"
                        value={subject}
                        onChange={(e) => {
                          const newSubjects = [...gpaFormData.subjects];
                          newSubjects[index] = e.target.value;
                          setGpaFormData((prev) => ({
                            ...prev,
                            subjects: newSubjects,
                          }));
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Grade (e.g. A+)"
                        value={gpaFormData.grades[index]}
                        onChange={(e) => {
                          const newGrades = [...gpaFormData.grades];
                          newGrades[index] = e.target.value;
                          setGpaFormData((prev) => ({
                            ...prev,
                            grades: newGrades,
                          }));
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Subject
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Calculate GPA
                </motion.button>
              </form>
            </div>
          </motion.div> */}

          {/* Rank Calculator Section */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white shadow sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Get Student Rank
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the start number and end number of your range to check the
                rank
              </p>

              <form onSubmit={handleRankSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startnum"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Start Number
                    </label>
                    <input
                      type="number"
                      id="startnum"
                      value={rankForm.startnum}
                      onChange={(e) =>
                        setRankForm((prev) => ({
                          ...prev,
                          startnum: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endnum"
                      className="block text-sm font-medium text-gray-700"
                    >
                      End Number
                    </label>
                    <input
                      type="number"
                      id="endnum"
                      value={rankForm.endnum}
                      onChange={(e) =>
                        setRankForm((prev) => ({
                          ...prev,
                          endnum: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="stnumrank"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your Student Number
                  </label>
                  <input
                    type="number"
                    id="stnumrank"
                    value={rankForm.stnumrank}
                    onChange={(e) =>
                      setRankForm((prev) => ({
                        ...prev,
                        stnumrank: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="gpatype"
                    className="block text-sm font-medium text-gray-700"
                  >
                    GPA Type
                  </label>
                  <select
                    id="gpatype"
                    value={rankForm.gpatype}
                    onChange={(e) =>
                      setRankForm((prev) => ({
                        ...prev,
                        gpatype: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="gpa">Overall GPA</option>
                    <option value="mathGpa">Math GPA</option>
                    <option value="cheGpa">Chemistry GPA</option>
                    <option value="phyGpa">Physics GPA</option>
                    <option value="zooGpa">Zoology GPA</option>
                    <option value="botGpa">Botany GPA</option>
                    <option value="csGpa">Computer Science GPA</option>
                  </select>
                </div>

                <p className="text-sm text-red-500">
                  This result may be delayed due to higher calculations!
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Calculate Rank
                </motion.button>
              </form>

              {rankData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {Object.entries({
                    "Total Students": rankData.totalCount,
                    "Your Rank": rankData.rank,
                    "Highest GPA": rankData.highestGpa,
                    "Lowest GPA": rankData.lowestGpa,
                    "Average GPA": rankData.averageGpa,
                  }).map(([label, value]) => (
                    <div key={label} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500">
                        {label}
                      </h3>
                      <p className="mt-1 text-2xl font-semibold text-indigo-600">
                        {value}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div> */}
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
