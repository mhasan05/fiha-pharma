"use client"

import { useEffect, useRef } from "react"

export default function SalesChart() {
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

      // Draw grid lines
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 1

      // Horizontal grid lines
      for (let i = 0; i <= 6; i++) {
        const y = (height / 6) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw y-axis labels
      ctx.fillStyle = "#9CA3AF"
      ctx.font = `${Math.max(10, width * 0.025)}px sans-serif`
      const yLabels = ["150K", "125K", "100K", "75K", "50K", "25K", "0"]
      yLabels.forEach((label, i) => {
        const y = (height / 6) * i + 5
        ctx.fillText(label, 10, y)
      })

      // Draw x-axis labels
      const xLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const xStep = (width - 60) / (xLabels.length - 1)
      xLabels.forEach((label, i) => {
        const x = 60 + i * xStep
        ctx.fillText(label, x - 10, height - 10)
      })

      // Draw the green curve
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 3
      ctx.beginPath()

      // Sample data points for the curve
      const dataPoints = [
        { x: 60, y: height * 0.7 },
        { x: 60 + xStep, y: height * 0.6 },
        { x: 60 + xStep * 2, y: height * 0.5 },
        { x: 60 + xStep * 3, y: height * 0.4 },
        { x: 60 + xStep * 4, y: height * 0.3 },
        { x: 60 + xStep * 5, y: height * 0.2 },
        { x: 60 + xStep * 6, y: height * 0.35 },
        { x: 60 + xStep * 7, y: height * 0.25 },
        { x: 60 + xStep * 8, y: height * 0.15 },
        { x: 60 + xStep * 9, y: height * 0.2 },
        { x: 60 + xStep * 10, y: height * 0.1 },
        { x: 60 + xStep * 11, y: height * 0.05 },
      ]

      // Draw smooth curve
      ctx.moveTo(dataPoints[0].x, dataPoints[0].y)
      for (let i = 1; i < dataPoints.length; i++) {
        const prevPoint = dataPoints[i - 1]
        const currentPoint = dataPoints[i]
        const cpx = (prevPoint.x + currentPoint.x) / 2
        ctx.quadraticCurveTo(cpx, prevPoint.y, currentPoint.x, currentPoint.y)
      }
      ctx.stroke()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  return (
    <div className="w-full h-48 sm:h-56 lg:h-64 relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
