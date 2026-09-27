import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { FounderSignOutButton } from "@/components/founder/FounderSignOutButton";

export default async function FounderAdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/founder/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect("/founder/login");
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
          <FounderSignOutButton />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
