"use client";

import { Download } from "lucide-react";
import { exportToPDF, exportToCSV, ExportOptions } from "@/lib/export";

interface Props {
  build: () => ExportOptions;   // builds {filename, title, subtitle, sections} from current data
  disabled?: boolean;
}

export default function ExportButtons({ build, disabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportToPDF(build())}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition text-sm"
      >
        <Download className="h-4 w-4" /> Download PDF
      </button>
      <button
        onClick={() => exportToCSV(build())}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 transition text-sm"
      >
        <Download className="h-4 w-4" /> Download Excel
      </button>
    </div>
  );
}
