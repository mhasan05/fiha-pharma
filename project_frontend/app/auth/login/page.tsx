
"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useLoginMutation } from "@/redux/feature/authSlice";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveTokens } from "@/service/authService";

export default function SignIn() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [login] = useLoginMutation();

  // Basic phone number validation (example: 10 digits or specific format)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login({ phone, password }).unwrap(); // Use unwrap to handle promise
      console.log("Login response:", res);

      localStorage.setItem("accessToken", res.access_token);
      await saveTokens(res?.access_token, );
      // Assuming the API returns a success message or token
      toast.success("Login successful!");

      // Optionally redirect after successful login
      router.push("/"); // Uncomment if using Next.js router
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000209E5] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#2c2e33] rounded-lg p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-4xl font-semibold text-white text-center">
            Sign In
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Input */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-gray-300 text-sm">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-[#4a4d55] border-[#5a5d65] text-white placeholder:text-gray-400 p-4 rounded-full focus:border-green-500 focus:ring-green-500/20 h-11"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2 relative">
            <label htmlFor="password" className="text-gray-300 text-sm">
              Password
            </label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#4a4d55] border-[#5a5d65] rounded-full text-white p-4 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 h-11 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-12 -translate-y-1/2 h-auto p-1 text-gray-400 hover:text-white hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Remember Me & Forgot Password */}
          {/* <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
              <label
                htmlFor="remember"
                className="text-gray-300 cursor-pointer"
              >
                Remember me
              </label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div> */}

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#44B46E] hover:bg-green-600 rounded-full text-white font-medium h-11 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Sign Up Link */}
        {/* <div className="text-center mt-4 text-sm text-gray-300">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            Sign Up
          </Link>
        </div> */}
      </div>
    </div>
  );
}
