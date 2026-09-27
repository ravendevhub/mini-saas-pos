"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { founderLoginAction } from "@/actions/founder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FounderLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const res = await founderLoginAction({ email, password });
      if (!res.success) {
        toast.error(res.error || "Authentication failed.");
      } else {
        toast.success("Founder authenticated successfully.");
        router.push("/founder");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Founder Portal</h1>
          <p className="text-xs text-slate-400">
            Multi-Tenant SaaS Platform Super Admin Control Plane
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-200">
              Sign in with Founder Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Founder Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@minisaaspos.com"
                    className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Secret Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 font-medium transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Authenticating Super Admin...
                  </>
                ) : (
                  "Access Founder Console"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Switch to Merchant Store Login
          </Link>
        </div>
      </div>
    </div>
  );
}
