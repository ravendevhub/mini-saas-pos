"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { registerTenantAction } from "@/actions/auth";
import { toast } from "sonner";
import { ShoppingBag, Store, Hash, User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [shopCode, setShopCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleStoreNameChange(val: string) {
    setStoreName(val);
    if (!shopCode) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setShopCode(generated);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const res = await registerTenantAction({
        storeName,
        shopCode,
        fullName,
        email,
        password,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create store.");
      } else {
        toast.success("Store created successfully with a 30-day Free Trial.");
        router.push("/login");
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
        <div className="absolute inset-0 bg-slate-950/25 backdrop-brightness-[0.95]" />
      </div>

      <header className="relative z-10 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-white stroke-[2.2]" />
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
            Mini SaaS <span className="text-indigo-300">POS</span>
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-5 text-white pr-6">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] drop-shadow-md">
                Start Your <br />
                Store{" "}
                <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Journey
                </span>
              </h1>
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-sm" />
              <p className="max-w-md text-base sm:text-lg text-slate-100 leading-relaxed font-normal drop-shadow-sm">
                Set up your multi-user retail cloud POS terminal in under 2 minutes with an instant 30-day Free Trial.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full max-w-[460px] rounded-3xl bg-white/85 backdrop-blur-2xl border border-white shadow-2xl p-6 sm:p-8 text-slate-900 transition-all">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
                  <Store className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Create Store
                  </h2>
                  <p className="text-xs text-slate-500">
                    Register your merchant account and unique shop code
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <ErrorBanner message={errorMessage} />

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="storeName">
                    Store Name *
                  </label>
                  <div className="relative flex items-center">
                    <Store className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="storeName"
                      required
                      value={storeName}
                      onChange={(e) => handleStoreNameChange(e.target.value)}
                      placeholder="Downtown Grocery"
                      className="h-10 rounded-xl border-slate-200/80 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="shopCode">
                    Unique Shop Code *
                  </label>
                  <div className="relative flex items-center">
                    <Hash className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="shopCode"
                      required
                      value={shopCode}
                      onChange={(e) => setShopCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="downtown"
                      className="h-10 rounded-xl border-slate-200/80 bg-white pl-10 pr-4 font-mono text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Terminal URL: /{shopCode || "shopcode"}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="fullName">
                    Owner Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="h-10 rounded-xl border-slate-200/80 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="email">
                    Owner Email *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="h-10 rounded-xl border-slate-200/80 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="password">
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 rounded-xl border-slate-200/80 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm mt-3 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Store...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Store</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-600">Already registered? </span>
                  <Link href="/login" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                    Sign In
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
