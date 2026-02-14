import { motion } from "framer-motion";
import { Bell, AlertCircle } from "lucide-react";

interface NoticeBoardProps {
  notices: string[];
  loading?: boolean;
}

export default function NoticeBoard({ notices, loading }: NoticeBoardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Notices & Announcements
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {notices.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">No notices available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((notice, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-700">
                    {i + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {notice}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
