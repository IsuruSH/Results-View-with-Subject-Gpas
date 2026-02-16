import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { Notice } from "../../types";

interface NoticeViewerProps {
  notice: Notice | null;
  sessionId: string | null;
  onClose: () => void;
}

const FILE_TYPE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  pdf: { label: "PDF Document", icon: FileText },
  docx: { label: "Word Document", icon: FileSpreadsheet },
  html: { label: "HTML Notice", icon: ExternalLink },
  png: { label: "Image", icon: ImageIcon },
  jpg: { label: "Image", icon: ImageIcon },
  other: { label: "File", icon: FileText },
};

/**
 * Build the viewer URL for a given notice.
 * - PDF: embed directly (FOSMIS serves PDFs without X-Frame-Options)
 * - DOCX: use Office Online Viewer
 * - Images: rendered inline via <img>
 */
function getViewerUrl(notice: Notice, sessionId: string | null): string | null {
  if (notice.fileType === "pdf") {
    return notice.fileUrl;
  }
  if (notice.fileType === "docx") {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(notice.fileUrl)}`;
  }
  if (notice.fileType === "html") {
    // Proxy HTML content to bypass CORS and inject <base> tag
    const proxyBase = `${import.meta.env.VITE_SERVER_URL}/notices/proxy`;
    let url = `${proxyBase}?url=${encodeURIComponent(notice.fileUrl)}`;
    if (sessionId) {
      url += `&session=${encodeURIComponent(sessionId)}`;
    }
    return url;
  }
  // Images/Text are rendered directly
  return null;
}

export default function NoticeViewer({ notice, sessionId, onClose }: NoticeViewerProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  if (!notice) return null;

  const isImage = notice.fileType === "png" || notice.fileType === "jpg";
  const isHtml = notice.fileType === "html";
  const hasContent = !!notice.content;
  const viewerUrl = getViewerUrl(notice, sessionId);
  const meta = FILE_TYPE_LABELS[notice.fileType] || FILE_TYPE_LABELS.other;
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {notice.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{notice.date}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${notice.fileType === "pdf"
                      ? "bg-red-100 text-red-700"
                      : notice.fileType === "docx"
                        ? "bg-blue-100 text-blue-700"
                        : notice.fileType === "html"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                  >
                    {notice.fileType}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={notice.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
              <a
                href={notice.fileUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden">
            {/* Loading spinner */}
            {!isImage && iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-sm text-gray-500">Loading document...</p>
                </div>
              </div>
            )}

            {/* PDF / DOCX / HTML via iframe */}
            {viewerUrl && (
              <iframe
                src={viewerUrl}
                title={notice.title}
                className={`w-full h-full border-0 ${isHtml ? "bg-white" : ""}`}
                onLoad={() => setIframeLoading(false)}
              />
            )}

            {/* Text Content Notices */}
            {!viewerUrl && !isImage && hasContent && (
              <div className="w-full h-full bg-white overflow-auto p-8">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
                    {notice.title}
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </div>
                </div>
              </div>
            )}

            {/* Images */}
            {isImage && !imgError && (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-6">
                <img
                  src={notice.fileUrl}
                  alt={notice.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  onError={() => setImgError(true)}
                />
              </div>
            )}

            {/* Image error fallback */}
            {isImage && imgError && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                <ImageIcon className="w-12 h-12" />
                <p className="text-sm">Unable to load image</p>
                <a
                  href={notice.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                >
                  Open in new tab
                </a>
              </div>
            )}

            {/* Unsupported / Missing Link fallback */}
            {!viewerUrl && !isImage && !hasContent && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                <FileText className="w-12 h-12" />
                <p className="text-sm">
                  {notice.fileUrl ? "Preview not available for this file type" : "This notice has no attached document"}
                </p>
                {notice.fileUrl && (
                  <a
                    href={notice.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Open in new tab
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
