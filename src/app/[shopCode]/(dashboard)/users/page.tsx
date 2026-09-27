import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffTable } from "@/components/users/StaffTable";
import { ProfileWithRole } from "@/types";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const [userRes, tenantRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tenants")
      .select("id")
      .eq("shop_code", shopCode)
      .single(),
  ]);

  const user = userRes.data?.user;
  const tenant = tenantRes.data;

  if (!tenant) {
    notFound();
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select(`
      tenant_id,
      is_super_admin,
      role_id,
      roles:role_id (
        can_manage_users,
        can_view_users,
        can_create_users,
        can_delete_users
      )
    `)
    .eq("id", user?.id || "")
    .single();

  const permissions = currentProfile?.roles as unknown as {
    can_manage_users?: boolean;
    can_view_users?: boolean;
    can_create_users?: boolean;
    can_delete_users?: boolean;
  } | null;

  const isSuperAdmin = Boolean(currentProfile?.is_super_admin);
  const isOwner = currentProfile?.role_id === "owner";
  const canView = Boolean(isSuperAdmin || isOwner || permissions?.can_view_users || permissions?.can_manage_users);
  const canCreate = Boolean(isSuperAdmin || isOwner || permissions?.can_create_users || permissions?.can_manage_users);
  const canDelete = Boolean(isSuperAdmin || isOwner || permissions?.can_delete_users || permissions?.can_manage_users);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg max-w-md mx-auto my-12">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          You do not have permission to view or manage staff accounts.
        </p>
      </div>
    );
  }

  const { data: staffList } = await supabase
    .from("profiles")
    .select(`
      *,
      roles:role_id (*)
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Staff Management</h1>
        <p className="text-xs text-slate-500">
          Manage cashiers and store managers with role-based access permissions.
        </p>
      </div>

      <StaffTable
        staffList={(staffList || []) as unknown as ProfileWithRole[]}
        shopCode={shopCode}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
