"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Component() {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false

    const newOtp = [...otp]
    newOtp[index] = element.value
    setOtp(newOtp)

    // Focus next input
    if (element.value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp]

      if (otp[index]) {
        // Clear current input
        newOtp[index] = ""
        setOtp(newOtp)
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = ""
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData("text")
    const pasteArray = pasteData.slice(0, 6).split("")

    if (pasteArray.every((char) => !isNaN(Number(char)))) {
      const newOtp = new Array(6).fill("")
      pasteArray.forEach((char, index) => {
        if (index < 6) newOtp[index] = char
      })
      setOtp(newOtp)

      // Focus the next empty input or last input
      const nextIndex = Math.min(pasteArray.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpValue = otp.join("")

    if (otpValue.length !== 6) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("OTP verification:", otpValue)
    setIsLoading(false)
  }

  const handleResendOTP = async () => {
    // Simulate resend OTP
    console.log("Resending OTP...")
    setOtp(new Array(6).fill(""))
    inputRefs.current[0]?.focus()
  }

  const isComplete = otp.every((digit) => digit !== "")

  return (
      <div className="min-h-screen bg-[#000209E5] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#2c2e33] rounded-lg p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-4xl font-semibold text-white text-center">
            Verify Email
            </h1>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="size-14 text-center text-lg font-semibold bg-[#4a4d55] border-[#5a5d65] text-white focus:border-green-500 focus:ring-green-500/20 rounded-full"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            type="submit"
            disabled={!isComplete || isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-medium h-11 rounded-md transition-colors"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-400">Please enter the OTP we have sent you in your email.</p>

          {/* Resend OTP */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              className="text-sm text-green-500 hover:text-green-400 transition-colors underline"
            >
              Didn't receive the code? Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
