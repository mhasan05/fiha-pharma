// "use client"

// import { useAllDashboardQuery } from "@/redux/feature/dashboardSlice"
// import { useEffect, useRef } from "react"

// export default function MostSellingChart() {

//     const {data: dashboard} =useAllDashboardQuery(undefined)
//   console.log("dashboard",dashboard?.data)
//   const canvasRef = useRef<HTMLCanvasElement>(null)

//   useEffect(() => {
//     const canvas = canvasRef.current
//     if (!canvas) return

//     const ctx = canvas.getContext("2d")
//     if (!ctx) return

//     const resizeCanvas = () => {
//       const rect = canvas.getBoundingClientRect()
//       const dpr = window.devicePixelRatio || 1

//       canvas.width = rect.width * dpr
//       canvas.height = rect.height * dpr
//       ctx.scale(dpr, dpr)

//       const width = rect.width
//       const height = rect.height

//       // Clear canvas
//       ctx.clearRect(0, 0, width, height)

//       // Draw grid lines
//       ctx.strokeStyle = "#374151"
//       ctx.lineWidth = 1

//       // Horizontal grid lines
//       for (let i = 0; i <= 6; i++) {
//         const y = (height / 6) * i
//         ctx.beginPath()
//         ctx.moveTo(0, y)
//         ctx.lineTo(width, y)
//         ctx.stroke()
//       }

//       // Draw y-axis labels
//       ctx.fillStyle = "#9CA3AF"
//       ctx.font = `${Math.max(8, width * 0.02)}px sans-serif`
//       const yLabels = ["60", "50", "40", "30", "20", "10", "0"]
//       yLabels.forEach((label, i) => {
//         const y = (height / 6) * i + 5
//         ctx.fillText(label, 5, y)
//       })

//       // Draw x-axis labels
//       const xLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
//       const barWidth = Math.max(15, width * 0.08)
//       const spacing = (width - 40) / xLabels.length

//       xLabels.forEach((label, i) => {
//         const x = 30 + i * spacing
//         ctx.fillText(label, x - 5, height - 5)
//       })

//       // Draw bars with data
//       const barData = [40, 35, 45, 50, 30, 55] // Sample data
//       const maxValue = 60

//       barData.forEach((value, i) => {
//         const x = 30 + i * spacing - barWidth / 2
//         const barHeight = (value / maxValue) * (height - 40)
//         const y = height - 20 - barHeight

//         // Highlight the 4th bar (43%)
//         if (i === 3) {
//           ctx.fillStyle = "#10B981"
//           // Draw percentage label
//           ctx.fillStyle = "#FFFFFF"
//           ctx.font = `bold ${Math.max(10, width * 0.03)}px sans-serif`
//           ctx.fillText("43%", x - 5, y - 10)
//           ctx.fillStyle = "#10B981"
//         } else {
//           ctx.fillStyle = "#4B5563"
//         }

//         ctx.fillRect(x, y, barWidth, barHeight)
//       })
//     }

//     resizeCanvas()
//     window.addEventListener("resize", resizeCanvas)

//     return () => window.removeEventListener("resize", resizeCanvas)
//   }, [])

//   return (
//     <div className="w-full h-40 sm:h-44 lg:h-48 relative">
//       <canvas ref={canvasRef} className="w-full h-full" />
//     </div>
//   )
// }
"use client";

import { useAllDashboardQuery } from "@/redux/feature/dashboardSlice";
import { useEffect, useRef } from "react";

export default function MostSellingChart() {
  const { data: dashboard } = useAllDashboardQuery(undefined);
  console.log("dashboard", dashboard?.data);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 6; i++) {
        const y = (height / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw y-axis labels
      ctx.fillStyle = "#9CA3AF";
      ctx.font = `${Math.max(8, width * 0.02)}px sans-serif`;
      const maxValue = 300; // Adjusted based on total sales (298.0)
      const yLabels = [0, 50, 100, 150, 200, 250, 300].map((v) =>
        v.toString()
      );
      yLabels.forEach((label, i) => {
        const y = (height / 6) * i + 5;
        ctx.fillText(label, 5, y);
      });

      // Draw x-axis labels
      const xLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const barWidth = Math.max(10, width * 0.04);
      const spacing = (width - 40) / xLabels.length;

      xLabels.forEach((label, i) => {
        const x = 30 + i * spacing;
        ctx.fillText(label, x - 5, height - 5);
      });

      // Draw bars with dynamic data
      const salesData = dashboard?.data?.sales_by_month?.map(
        (item: any) => item.total_sales || 0
      ) || [0, 0, 0, 0, 0, 0, 298.0, 0, 0, 0, 0, 0]; // Default to 0, use July's 298.0
      const maxDataValue = Math.max(...salesData, maxValue);

      salesData.forEach((value: number, i: number) => {
        const x = 30 + i * spacing - barWidth / 2;
        const barHeight = (value / maxDataValue) * (height - 40);
        const y = height - 20 - barHeight;

        // Highlight the 7th bar (July) since it has data
        if (i === 6) {
          ctx.fillStyle = "#10B981";
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `bold ${Math.max(10, width * 0.03)}px sans-serif`;
          ctx.fillText(
            `${((value / maxDataValue) * 100).toFixed(0)}%`,
            x - 5,
            y - 10
          );
          ctx.fillStyle = "#10B981";
        } else {
          ctx.fillStyle = "#4B5563";
        }

        ctx.fillRect(x, y, barWidth, barHeight);
      });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [dashboard]);

  return (
    <div className="w-full h-40 sm:h-44 lg:h-48 relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}