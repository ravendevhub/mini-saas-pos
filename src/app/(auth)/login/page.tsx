"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { loginAction } from "@/actions/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          router.push("/founder");
        } else if (res.data?.shopCode) {
          router.push(`/${res.data.shopCode}/pos`);
        } else {
          router.push("/login");
        }
        router.refresh();
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-sm border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-4 sm:p-6 space-y-1">
          <CardTitle className="text-xl font-semibold text-slate-900">Sign In</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Enter your credentials to access your store terminal or console.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={errorMessage} />
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cashier@example.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">New merchant? </span>
              <Link href="/register" className="text-xs font-medium text-indigo-600 hover:underline">
                Register Store
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
