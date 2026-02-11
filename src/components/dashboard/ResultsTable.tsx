import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Table2, Loader2, MoveHorizontal } from "lucide-react";

interface ResultsTableProps {
  html: string | undefined;
  rlevel: string;
  onRlevelChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  "4": "All Levels",
  "1": "Level 1",
  "2": "Level 2",
  "3": "Level 3",
};

export default function ResultsTable({
  html,
  rlevel,
  onRlevelChange,
  onRefresh,
  loading,
}: ResultsTableProps) {
  const [expanded, setExpanded] = useState(true);

  // Count rows in the injected HTML to show a badge
  const rowCount = useMemo(() => {
    if (!html) return 0;
    return (html.match(/<tr[^>]*class="trbgc"/gi) || []).length;
  }, [html]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
        >
          <Table2 className="w-4 h-4" />
          <span className="hidden sm:inline">Results Table</span>
          <span className="sm:hidden">Results</span>
          {rowCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 normal-case tracking-normal">
              {rowCount} subjects
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Level pills on desktop, dropdown on mobile */}
          <div className="hidden sm:flex items-center rounded-lg border border-gray-200 overflow-hidden">
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => onRlevelChange(value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  rlevel === value
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={rlevel}
            onChange={(e) => onRlevelChange(e.target.value)}
            className="sm:hidden text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
          >
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {/* Collapsible body */}
      <AnimatePresence>
        {expanded && html && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Mobile scroll hint */}
            <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-gray-400 sm:hidden">
              <MoveHorizontal className="w-3 h-3" />
              Swipe to scroll table
            </div>

            <div className="px-2 pb-4 sm:px-4 sm:py-4">
              <div className="results-container rounded-lg border border-gray-100 overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!html && !loading && (
        <div className="px-6 py-12 flex flex-col items-center gap-3 text-gray-400">
          <Table2 className="w-8 h-8 text-gray-300" />
          <p className="text-sm">Click "Refresh" to load your results</p>
        </div>
      )}

      {/* Loading state */}
      {!html && loading && (
        <div className="px-6 py-12 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-sm">Fetching results...</p>
        </div>
      )}
    </motion.div>
  );
}
