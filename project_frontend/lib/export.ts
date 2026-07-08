import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportSection {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ExportOptions {
  filename: string;          // without extension
  title: string;
  subtitle?: string;
  sections: ExportSection[];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Multi-section PDF (one autotable per section, with a section heading). */
export function exportToPDF(opts: ExportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const marginX = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(26, 58, 82);
  doc.text(opts.title, marginX, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  let y = 56;
  if (opts.subtitle) {
    doc.text(opts.subtitle, marginX, y);
    y += 12;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
  y += 16;

  opts.sections.forEach((sec) => {
    if (sec.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(sec.title, marginX, y);
      y += 6;
    }
    autoTable(doc, {
      startY: y,
      head: [sec.headers],
      body: sec.rows.length ? sec.rows : [["—", ...sec.headers.slice(1).map(() => "")]],
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [26, 58, 82], textColor: 255 },
      margin: { left: marginX, right: marginX },
    });
    // @ts-ignore — jspdf-autotable attaches lastAutoTable
    y = (doc.lastAutoTable?.finalY ?? y) + 24;
  });

  doc.save(`${opts.filename}.pdf`);
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Multi-section CSV (UTF-8 BOM so Excel renders correctly). */
export function exportToCSV(opts: ExportOptions) {
  const lines: string[] = [];
  lines.push(csvCell(opts.title));
  if (opts.subtitle) lines.push(csvCell(opts.subtitle));
  lines.push("");

  opts.sections.forEach((sec) => {
    if (sec.title) lines.push(csvCell(sec.title));
    lines.push(sec.headers.map(csvCell).join(","));
    sec.rows.forEach((r) => lines.push(r.map(csvCell).join(",")));
    lines.push("");
  });

  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${opts.filename}.csv`);
}
