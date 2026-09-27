import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TenantWithPlan, Profile, Role } from "@/types";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const [tenantRes, profileRes] = await Promise.all([
    supabase
      .from("tenants")
      .select(`
        *,
        subscription_plans:plan_id (*)
      `)
      .eq("shop_code", shopCode)
      .single(),
    supabase
      .from("profiles")
      .select(`
        *,
        roles:role_id (*)
      `)
      .eq("id", user.id)
      .single(),
  ]);

  const tenant = tenantRes.data;
  const profile = profileRes.data;

  if (tenantRes.error || !tenant) {
    notFound();
  }

  if (profileRes.error || !profile || !profile.roles) {
    redirect("/login");
  }

  if (profile.tenant_id !== tenant.id && !profile.is_super_admin) {
    redirect("/login");
  }

  const typedTenant = tenant as unknown as TenantWithPlan;
  const role = profile.roles as unknown as Role;
  const userProfile = {
    id: profile.id,
    tenant_id: profile.tenant_id,
    role_id: profile.role_id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    is_super_admin: profile.is_super_admin,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  } as Profile;

  const isSuspended = typedTenant.subscription_status === "suspended";
  const isExpired =
    typedTenant.subscription_expires_at &&
    new Date(typedTenant.subscription_expires_at) < new Date();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar tenant={typedTenant} profile={userProfile} role={role} shopCode={shopCode} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav tenant={typedTenant} profile={userProfile} role={role} shopCode={shopCode} />

        {isSuspended ? (
          <div className="p-4 sm:p-6">
            <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-center max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h2 className="text-sm font-semibold text-red-900">Store Suspended</h2>
              <p className="text-xs text-red-700 mt-1">
                Your store subscription is currently suspended. Please contact platform administrators to reactivate your access.
              </p>
            </div>
          </div>
        ) : (
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {isExpired && (
              <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>Your store subscription plan has expired. Please renew to avoid service interruption.</span>
              </div>
            )}
            {children}
          </main>
        )}
      </div>
    </div>
  );
}
