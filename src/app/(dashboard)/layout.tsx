import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Tenant, Profile, Role } from "@/types";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      *,
      tenants:tenant_id (*),
      roles:role_id (*)
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.tenants || !profile.roles) {
    redirect("/login");
  }

  const tenant = profile.tenants as unknown as Tenant;
  const role = profile.roles as unknown as Role;
  const userProfile = {
    id: profile.id,
    tenant_id: profile.tenant_id,
    role_id: profile.role_id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  } as Profile;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar tenant={tenant} profile={userProfile} role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav tenant={tenant} profile={userProfile} role={role} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
