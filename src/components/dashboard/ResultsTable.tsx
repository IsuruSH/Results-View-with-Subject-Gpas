import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Table2,
  Loader2,
  MoveHorizontal,
  Calendar,
} from "lucide-react";

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

interface ParsedRow {
  code: string;
  name: string;
  grade: string;
  year: string;
  rawHtml: string;
}

/** Try to extract structured rows from FOSMIS HTML for grouping. */
function parseRows(html: string): ParsedRow[] | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rows = doc.querySelectorAll("tr.trbgc");
    if (rows.length === 0) return null;

    const parsed: ParsedRow[] = [];
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 4) return;
      parsed.push({
        code: tds[0].textContent?.trim() ?? "",
        name: tds[1].textContent?.trim() ?? "",
        grade: tds[2].textContent?.trim() ?? "",
        year: tds[3].textContent?.trim() ?? "",
        rawHtml: (tr as HTMLElement).outerHTML,
      });
    });
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/** Extract the table header row HTML from the original HTML. */
function extractHeaderHtml(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headerRow = doc.querySelector("tr:has(th)") ?? doc.querySelector("thead tr");
    return headerRow ? (headerRow as HTMLElement).outerHTML : "";
  } catch {
    return "";
  }
}

/** Extract the font title (e.g. exam name) from the HTML. */
function extractTitle(html: string): string {
  const match = html.match(/<font[^>]*color="red"[^>]*>(.*?)<\/font>/i);
  return match ? match[1] : "";
}

export default function ResultsTable({
  html,
  rlevel,
  onRlevelChange,
  onRefresh,
  loading,
}: ResultsTableProps) {
  const [expanded, setExpanded] = useState(true);
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());

  const rowCount = useMemo(() => {
    if (!html) return 0;
    return (html.match(/<tr[^>]*class="trbgc"/gi) || []).length;
  }, [html]);

  // Parse rows and group by year
  const { grouped, headerHtml, title } = useMemo(() => {
    if (!html) return { grouped: null, headerHtml: "", title: "" };
    const rows = parseRows(html);
    if (!rows) return { grouped: null, headerHtml: "", title: "" };

    const groups: Record<string, ParsedRow[]> = {};
    for (const row of rows) {
      const yr = row.year || "Unknown";
      if (!groups[yr]) groups[yr] = [];
      groups[yr].push(row);
    }

    // Sort years descending (newest first)
    const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));

    return {
      grouped: sorted,
      headerHtml: extractHeaderHtml(html),
      title: extractTitle(html),
    };
  }, [html]);

  const toggleYear = (year: string) => {
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

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
            <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-gray-400 sm:hidden">
              <MoveHorizontal className="w-3 h-3" />
              Swipe to scroll table
            </div>

            <div className="px-2 pb-4 sm:px-4 sm:py-4">
              {/* Title */}
              {title && (
                <div className="text-sm font-semibold text-indigo-700 mb-3 text-center py-2 bg-indigo-50 rounded-lg">
                  <span dangerouslySetInnerHTML={{ __html: title }} />
                </div>
              )}

              {/* Grouped view or fallback */}
              {grouped ? (
                <div className="space-y-3">
                  {grouped.map(([year, rows]) => {
                    const isCollapsed = collapsedYears.has(year);
                    return (
                      <div
                        key={year}
                        className="rounded-lg border border-gray-100 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleYear(year)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-600">
                              Year {year}
                            </span>
                            <span className="text-[10px] bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                              {rows.length} subjects
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                              isCollapsed ? "" : "rotate-180"
                            }`}
                          />
                        </button>

                        {!isCollapsed && (
                          <div className="results-container">
                            <table>
                              <thead
                                dangerouslySetInnerHTML={{ __html: headerHtml }}
                              />
                              <tbody
                                dangerouslySetInnerHTML={{
                                  __html: rows.map((r) => r.rawHtml).join(""),
                                }}
                              />
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="results-container rounded-lg border border-gray-100 overflow-hidden">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!html && !loading && (
        <div className="px-6 py-12 flex flex-col items-center gap-3 text-gray-400">
          <Table2 className="w-8 h-8 text-gray-300" />
          <p className="text-sm">Click &quot;Refresh&quot; to load your results</p>
        </div>
      )}

      {!html && loading && (
        <div className="px-6 py-12 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-sm">Fetching results...</p>
        </div>
      )}
    </motion.div>
  );
}
