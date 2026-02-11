import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface PdfExportProps {
  contentRef: React.RefObject<HTMLDivElement>;
  username: string | null;
}

export default function PdfExport({ contentRef, username }: PdfExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current || exporting) return;
    setExporting(true);

    try {
      // Lazy-load PDF libraries (zero impact on initial bundle)
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;

      // Title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Student Results Summary", margin, 15);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Student: SC${username ?? "N/A"}  |  Generated: ${new Date().toLocaleDateString()}`,
        margin,
        22
      );

      // Draw line
      pdf.setDrawColor(200);
      pdf.line(margin, 25, pageW - margin, 25);

      // Content image
      const imgH = (canvas.height * usableW) / canvas.width;
      let yPos = 28;

      // If image is taller than one page, scale to fit
      const maxImgH = pageH - yPos - margin;
      const finalH = Math.min(imgH, maxImgH);
      const finalW = imgH > maxImgH ? (canvas.width * finalH) / canvas.height : usableW;

      pdf.addImage(imgData, "PNG", margin, yPos, finalW, finalH);

      pdf.save(`results_SC${username ?? "student"}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
    >
      {exporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export PDF"}</span>
    </button>
  );
}
