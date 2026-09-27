import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

export default async function FounderLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 text-center shadow-sm">
          <Shield className="w-10 h-10 text-red-600 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-slate-900">Restricted Console</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Only verified platform founder administrators have access to this control plane.
          </p>
          <form action={logoutAction}>
            <Button size="sm" variant="outline" className="text-xs">
              Back to Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="h-14 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            SAAS
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Founder Super Admin Console</h1>
            <p className="text-[10px] text-slate-400">Multi-Tenant Platform Control Plane</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 hidden sm:inline">{profile.full_name}</span>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 h-8"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
