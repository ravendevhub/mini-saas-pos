"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { loginAction } from "@/actions/auth";
import { toast } from "sonner";
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to sign in.");
      } else {
        toast.success("Signed in successfully.");
        if (res.data?.isSuperAdmin) {
          window.location.href = "/founder";
        } else if (res.data?.shopCode) {
          window.location.href = `/${res.data.shopCode}/dashboard`;
        } else {
          window.location.href = "/login";
        }
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 z-0">
        <Image
          src="/login-bg.jpg"
          alt="Retail Store Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/30 to-slate-950/50" />
      </div>

      <header className="relative z-10 p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Mini SaaS <span className="text-indigo-400">POS</span>
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 text-white pr-4">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Run Your <br />
                Store{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                  Smarter
                </span>
              </h1>
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
              <p className="max-w-md text-base sm:text-lg text-slate-200/90 leading-relaxed font-normal">
                A modern, cloud-based POS designed for growing retail businesses.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] rounded-3xl bg-white/25 backdrop-blur-2xl border border-white/40 shadow-2xl p-7 sm:p-9 text-slate-900 transition-all">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Mini SaaS <span className="text-indigo-600">POS</span>
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <ErrorBanner message={errorMessage} />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="email">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-11 rounded-xl border-white/60 bg-white/80 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800" htmlFor="password">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-11 rounded-xl border-white/60 bg-white/80 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm mt-2 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-700 font-medium">New here? </span>
                  <Link href="/register" className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                    Create Account
                  </Link>
                </div>

                <div className="pt-3 border-t border-slate-300/40 text-center">
                  <Link
                    href="/founder/login"
                    className="text-[11px] font-medium text-slate-600 hover:text-indigo-700 transition-colors"
                  >
                    Platform Founder Console Sign In →
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-4 text-center text-xs text-slate-300/80">
        &copy; {new Date().getFullYear()} Mini SaaS POS. All rights reserved.
      </footer>
    </div>
  );
}
