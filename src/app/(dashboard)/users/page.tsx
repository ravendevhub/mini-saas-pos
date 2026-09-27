import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffTable } from "@/components/users/StaffTable";
import { ProfileWithRole } from "@/types";
import { ShieldAlert } from "lucide-react";

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("tenant_id, roles:role_id (can_manage_users)")
    .eq("id", user?.id || "")
    .single();

  const permissions = currentProfile?.roles as unknown as { can_manage_users?: boolean } | null;

  if (!permissions?.can_manage_users) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg max-w-md mx-auto my-12">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only the store owner has permission to manage staff accounts and roles.
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
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Staff Management</h1>
        <p className="text-xs text-slate-500">
          Manage cashiers and store managers with role-based access permissions.
        </p>
      </div>

      <StaffTable staffList={(staffList || []) as unknown as ProfileWithRole[]} />
    </div>
  );
}
