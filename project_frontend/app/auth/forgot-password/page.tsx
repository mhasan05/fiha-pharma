"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate to the login page
    router.push("/auth/verify-email");

    console.log("Sign in attempt:", { email });
    setIsLoading(false);
  };

  return (
    <div>
      {" "}
      <div className="min-h-screen bg-[#000209E5] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#2c2e33] rounded-lg p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-4xl font-semibold text-white text-center">
              Sign In
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#4a4d55] border-[#5a5d65] text-white placeholder:text-gray-400 p-4 rounded-full focus:border-green-500 focus:ring-green-500/20 h-11"
                required
              />
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#44B46E] hover:bg-green-600 rounded-full text-white font-medium h-11  transition-colors"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
