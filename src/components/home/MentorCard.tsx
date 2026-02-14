import { motion } from "framer-motion";
import { User, Mail, Phone, Building2, Briefcase } from "lucide-react";
import type { MentorDetails } from "../../types";

interface MentorCardProps {
  mentor: MentorDetails | null;
  loading?: boolean;
}

export default function MentorCard({ mentor, loading }: MentorCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!mentor || !mentor.name) {
    return null;
  }

  const details = [
    { icon: Briefcase, label: "Designation", value: mentor.designation },
    { icon: Building2, label: "Department", value: mentor.department },
    { icon: Mail, label: "Email", value: mentor.email, isEmail: true },
    { icon: Phone, label: "Mobile", value: mentor.mobile },
  ].filter((d) => d.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Your Mentor
        </h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {mentor.name}
            </p>
            {mentor.designation && (
              <p className="text-xs text-gray-500 truncate">
                {mentor.designation}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-start gap-2.5">
              <detail.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{detail.label}</p>
                {detail.isEmail ? (
                  <a
                    href={`mailto:${detail.value}`}
                    className="text-sm text-indigo-600 hover:underline truncate block"
                  >
                    {detail.value}
                  </a>
                ) : (
                  <p className="text-sm text-gray-700 truncate">
                    {detail.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
