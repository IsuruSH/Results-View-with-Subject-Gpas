import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { SubjectBreakdownRow } from "../../types";

interface ExcelExportProps {
  subjectBreakdown?: SubjectBreakdownRow[];
  username: string | null;
  gpa?: string;
}

/* ── colour palette ── */
const INDIGO = "4338CA"; // header bg
const INDIGO_LIGHT = "E0E7FF"; // semester header bg
const GRAY_BG = "F9FAFB"; // alternating row bg
const BORDER_COLOR = "D1D5DB";
const GREEN_BG = "DCFCE7"; // total row bg
const GREEN_DARK = "166534";
const BLUE_BG = "DBEAFE"; // GPA row bg
const BLUE_DARK = "1E40AF";

export default function ExcelExport({
  subjectBreakdown,
  username,
}: ExcelExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!subjectBreakdown || subjectBreakdown.length === 0 || exporting) return;
    setExporting(true);

    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      wb.creator = "Student Dashboard";
      wb.created = new Date();

      const ws = wb.addWorksheet("Results", {
        views: [{ showGridLines: false }],
      });

      /* ── Column definitions ── */
      ws.columns = [
        { key: "name", width: 44 },
        { key: "code", width: 15 },
        { key: "result", width: 10 },
        { key: "credit", width: 12 },
        { key: "scale", width: 14 },
        { key: "weighted", width: 24 },
      ];

      /* ── Helper: thin border style ── */
      const thinBorder = {
        top: { style: "thin" as const, color: { argb: BORDER_COLOR } },
        left: { style: "thin" as const, color: { argb: BORDER_COLOR } },
        bottom: { style: "thin" as const, color: { argb: BORDER_COLOR } },
        right: { style: "thin" as const, color: { argb: BORDER_COLOR } },
      };

      /* ── Row 1: Title ── */
      const titleRow = ws.addRow([
        `Student Results — SC${username ?? "N/A"}`,
      ]);
      ws.mergeCells(titleRow.number, 1, titleRow.number, 6);
      titleRow.height = 32;
      titleRow.getCell(1).font = {
        bold: true,
        size: 14,
        color: { argb: "FFFFFF" },
      };
      titleRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: INDIGO },
      };
      titleRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      /* ── Row 2: Date ── */
      const dateRow = ws.addRow([
        `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      ]);
      ws.mergeCells(dateRow.number, 1, dateRow.number, 6);
      dateRow.height = 20;
      dateRow.getCell(1).font = {
        size: 9,
        italic: true,
        color: { argb: "6B7280" },
      };
      dateRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      /* ── Row 3: blank spacer ── */
      ws.addRow([]);

      /* ── Row 4: Column headers ── */
      const headerLabels = [
        "Subject Name",
        "Subject Code",
        "Result",
        "Credits",
        "Grade Scale",
        "Credits × Grade Scale",
      ];
      const headerRow = ws.addRow(headerLabels);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: INDIGO },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = thinBorder;
      });

      /* ── Data rows grouped by semester ── */
      // Track which rows contain data (for SUM formulas)
      const creditDataRows: number[] = [];
      const weightedDataRows: number[] = [];
      let prevSemKey = "";
      let rowIsOdd = true;

      for (const item of subjectBreakdown) {
        const semKey = `${item.year}-${item.semester}`;

        if (prevSemKey && semKey !== prevSemKey) {
          // ── Semester separator: a styled sub-header ──
          const semLabel = `Year ${item.year} — Semester ${item.semester}`;
          const sepRow = ws.addRow([semLabel]);
          ws.mergeCells(sepRow.number, 1, sepRow.number, 6);
          sepRow.height = 22;
          sepRow.getCell(1).font = {
            bold: true,
            size: 10,
            color: { argb: INDIGO },
          };
          sepRow.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: INDIGO_LIGHT },
          };
          sepRow.getCell(1).alignment = { vertical: "middle" };
          sepRow.getCell(1).border = thinBorder;
          rowIsOdd = true; // reset alternation
        } else if (!prevSemKey) {
          // First semester header
          const semLabel = `Year ${item.year} — Semester ${item.semester}`;
          const sepRow = ws.addRow([semLabel]);
          ws.mergeCells(sepRow.number, 1, sepRow.number, 6);
          sepRow.height = 22;
          sepRow.getCell(1).font = {
            bold: true,
            size: 10,
            color: { argb: INDIGO },
          };
          sepRow.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: INDIGO_LIGHT },
          };
          sepRow.getCell(1).alignment = { vertical: "middle" };
          sepRow.getCell(1).border = thinBorder;
          rowIsOdd = true;
        }
        prevSemKey = semKey;

        const dataRow = ws.addRow([
          item.subjectName,
          item.subjectCode,
          item.grade,
          item.credit,
          item.gradeScale,
          null, // placeholder — formula set below using correct row number
        ]);

        const rowNum = dataRow.number;
        dataRow.getCell(6).value = { formula: `D${rowNum}*E${rowNum}` };
        creditDataRows.push(rowNum);
        weightedDataRows.push(rowNum);

        // Styling
        const bgColor = rowIsOdd ? "FFFFFF" : GRAY_BG;
        dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
          cell.border = thinBorder;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bgColor },
          };
          cell.font = { size: 10 };
          cell.alignment = {
            vertical: "middle",
            horizontal: colNum >= 4 ? "center" : "left",
          };
        });
        // Subject name left-aligned
        dataRow.getCell(1).alignment = {
          vertical: "middle",
          horizontal: "left",
        };
        dataRow.getCell(2).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        dataRow.getCell(3).alignment = {
          vertical: "middle",
          horizontal: "center",
        };

        rowIsOdd = !rowIsOdd;
      }

      /* ── Blank spacer ── */
      ws.addRow([]);

      /* ── TOTAL row with SUM formulas ── */
      // Build SUM formula referencing all data rows
      const creditCells = creditDataRows.map((r) => `D${r}`).join(",");
      const weightedCells = weightedDataRows.map((r) => `F${r}`).join(",");

      const totalRow = ws.addRow([
        "TOTAL",
        "",
        "",
        { formula: `SUM(${creditCells})` },
        "",
        { formula: `SUM(${weightedCells})` },
      ]);
      totalRow.height = 26;
      totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = thinBorder;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: GREEN_BG },
        };
        cell.font = {
          bold: true,
          size: 11,
          color: { argb: GREEN_DARK },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNum >= 4 ? "center" : "left",
        };
      });

      /* ── GPA row with formula ── */
      const totalRowNum = ws.rowCount;
      const gpaRow = ws.addRow([
        "GPA",
        "",
        "",
        "",
        "",
        { formula: `IF(D${totalRowNum}=0,0,ROUND(F${totalRowNum}/D${totalRowNum},2))` },
      ]);
      gpaRow.height = 28;
      gpaRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = thinBorder;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: BLUE_BG },
        };
        cell.font = {
          bold: true,
          size: 12,
          color: { argb: BLUE_DARK },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNum >= 4 ? "center" : "left",
        };
      });
      gpaRow.getCell(6).numFmt = "0.00";

      /* ── Freeze panes: keep header row visible ── */
      ws.views = [
        { state: "frozen", ySplit: headerRow.number, showGridLines: false },
      ];

      /* ── Generate and download ── */
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Results_SC${username ?? "student"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !subjectBreakdown?.length}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
    >
      {exporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {exporting ? "Exporting..." : "Export Excel"}
      </span>
    </button>
  );
}
