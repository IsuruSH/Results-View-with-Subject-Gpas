import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Eye,
  Search,
  Sparkles,
  Clock,
} from "lucide-react";
import type { Notice, NoticesData } from "../../types";
import NoticeViewer from "./NoticeViewer";

interface NoticeBoardProps {
  noticesData: NoticesData | null;
  loading?: boolean;
}

const FILE_TYPE_CONFIG: Record<
  string,
  { color: string; bg: string; icon: typeof FileText }
> = {
  pdf: { color: "text-red-700", bg: "bg-red-100", icon: FileText },
  docx: { color: "text-blue-700", bg: "bg-blue-100", icon: FileSpreadsheet },
  png: { color: "text-green-700", bg: "bg-green-100", icon: ImageIcon },
  jpg: { color: "text-green-700", bg: "bg-green-100", icon: ImageIcon },
  other: { color: "text-gray-700", bg: "bg-gray-100", icon: FileText },
};

function formatDate(dateStr: string): { month: string; day: string } {
  if (!dateStr) return { month: "", day: "" };
  const parts = dateStr.split("-");
  if (parts.length < 3) return { month: dateStr, day: "" };
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return {
    month: months[monthIdx] || parts[1],
    day: parts[2],
  };
}

function NoticeCard({
  notice,
  onView,
  index,
}: {
  notice: Notice;
  onView: (n: Notice) => void;
  index: number;
}) {
  const typeConfig = FILE_TYPE_CONFIG[notice.fileType] || FILE_TYPE_CONFIG.other;
  const TypeIcon = typeConfig.icon;
  const { month, day } = formatDate(notice.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50/60 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-200 cursor-pointer"
      onClick={() => onView(notice)}
    >
      {/* Date badge */}
      <div className="w-11 h-11 rounded-lg bg-white border border-gray-100 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-[9px] font-semibold text-gray-400 uppercase leading-tight">
          {month}
        </span>
        <span className="text-sm font-bold text-gray-800 leading-tight">
          {day}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium truncate group-hover:text-indigo-700 transition-colors">
          {notice.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color}`}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            {notice.fileType}
          </span>
          {notice.time && (
            <span className="text-[10px] text-gray-400">{notice.time}</span>
          )}
        </div>
      </div>

      {/* View button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(notice);
        }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all flex-shrink-0"
        title="View notice"
      >
        <Eye className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function NoticeBoard({ noticesData, loading }: NoticeBoardProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "previous">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const recent = noticesData?.recentNotices || [];
  const previous = noticesData?.previousNotices || [];
  const notices = activeTab === "recent" ? recent : previous;
  const totalCount = recent.length + previous.length;

  // Filter by search
  const filtered = searchQuery
    ? notices.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notices;

  return (
    <>
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
            {totalCount > 0 && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="px-4 pt-3 pb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Tabs */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "recent"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Recent ({recent.length})
            </button>
            <button
              onClick={() => setActiveTab("previous")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "previous"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-3 h-3" />
              Previous ({previous.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-shadow"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">
                {searchQuery
                  ? "No matching notices found"
                  : "No notices available"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + searchQuery}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1.5"
                >
                  {filtered.map((notice, i) => (
                    <NoticeCard
                      key={`${activeTab}-${notice.id}`}
                      notice={notice}
                      onView={setViewingNotice}
                      index={i}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Viewer modal */}
      {viewingNotice && (
        <NoticeViewer
          notice={viewingNotice}
          onClose={() => setViewingNotice(null)}
        />
      )}
    </>
  );
}
