import { motion } from "framer-motion";
import { GraduationCap, TrendingUp, BookOpen, Award } from "lucide-react";

interface HeroSectionProps {
  studentName: string;
  username: string | null;
  photoUrl: string | null;
  gpa?: string;
  totalCredits?: number;
  classLabel?: string;
}

function getClassLabel(gpa: number): string {
  if (gpa >= 3.7) return "First Class";
  if (gpa >= 3.3) return "Second Upper";
  if (gpa >= 3.0) return "Second Lower";
  if (gpa >= 2.0) return "General Pass";
  return "Below Pass";
}

export default function HeroSection({
  studentName,
  username,
  photoUrl,
  gpa,
  totalCredits,
}: HeroSectionProps) {
  const gpaNum = gpa ? parseFloat(gpa) : 0;
  const classLabel = gpaNum > 0 ? getClassLabel(gpaNum) : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 sm:p-8 text-white"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Profile photo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white/20 flex-shrink-0 bg-white/10">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white/40" />
            </div>
          )}
        </div>

        {/* Welcome text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-indigo-200/80">Welcome back,</p>
          <h2 className="text-2xl sm:text-3xl font-bold truncate mt-0.5">
            {studentName || "Student"}
          </h2>
          {username && (
            <p className="text-sm text-indigo-200/70 mt-1">
              SC{username} &middot; Faculty of Science
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {gpaNum > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-xs text-indigo-200/70">GPA</p>
                <p className="text-lg font-bold">{gpa}</p>
              </div>
            </div>
          )}
          {totalCredits != null && totalCredits > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <BookOpen className="w-5 h-5 text-amber-300" />
              <div>
                <p className="text-xs text-indigo-200/70">Credits</p>
                <p className="text-lg font-bold">{totalCredits}</p>
              </div>
            </div>
          )}
          {gpaNum > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <Award className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-xs text-indigo-200/70">Class</p>
                <p className="text-lg font-bold">{classLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
