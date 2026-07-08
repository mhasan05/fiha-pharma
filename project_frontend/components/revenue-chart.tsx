"use client"

import { useEffect, useRef } from "react"

export default function RevenueChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      const width = rect.width
      const height = rect.height

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw legend
      const legendSize = Math.max(8, width * 0.02)
      ctx.fillStyle = "#3B82F6"
      ctx.fillRect(10, 10, legendSize, legendSize)
      ctx.fillStyle = "#FFFFFF"
      ctx.font = `${Math.max(10, width * 0.025)}px sans-serif`
      ctx.fillText("Profit", 10 + legendSize + 8, 10 + legendSize)

      ctx.fillStyle = "#6B7280"
      ctx.fillRect(10 + legendSize + 50, 10, legendSize, legendSize)
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText("Loss", 10 + legendSize + 58, 10 + legendSize)

      // Draw y-axis labels
      ctx.fillStyle = "#9CA3AF"
      ctx.font = `${Math.max(8, width * 0.02)}px sans-serif`
      const yLabels = ["100k", "80k", "50k", "20k", "0"]
      yLabels.forEach((label, i) => {
        const y = 40 + ((height - 60) / 4) * i
        ctx.fillText(label, 5, y)
      })

      // Draw x-axis labels
      const xLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      const barWidth = Math.max(8, width * 0.025)
      const groupWidth = barWidth * 2 + 2
      const spacing = (width - 60) / xLabels.length

      xLabels.forEach((label, i) => {
        const x = 40 + i * spacing
        ctx.fillText(label, x - 5, height - 5)
      })

      // Draw bars
      const profitData = [60, 80, 70, 90, 40, 85, 50, 75, 65]
      const lossData = [40, 60, 50, 70, 30, 65, 35, 55, 45]
      const maxValue = 100

      profitData.forEach((profit, i) => {
        const loss = lossData[i]
        const x = 40 + i * spacing - groupWidth / 2

        // Profit bar (blue)
        const profitHeight = (profit / maxValue) * (height - 80)
        const profitY = height - 20 - profitHeight
        ctx.fillStyle = "#3B82F6"
        ctx.fillRect(x, profitY, barWidth, profitHeight)

        // Loss bar (gray)
        const lossHeight = (loss / maxValue) * (height - 80)
        const lossY = height - 20 - lossHeight
        ctx.fillStyle = "#6B7280"
        ctx.fillRect(x + barWidth + 2, lossY, barWidth, lossHeight)
      })
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  return (
    <div className="w-full h-40 sm:h-44 lg:h-48 relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
