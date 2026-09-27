"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { CreateStaffSchema } from "@/validations/auth";
import { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export async function createStaffAction(formData: unknown): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        tenant_id,
        roles:role_id (can_manage_users),
        tenants:tenant_id (
          subscription_status,
          subscription_plans:plan_id (name, max_staff)
        )
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = profile.roles as unknown as { can_manage_users?: boolean } | null;
    if (!permissions?.can_manage_users) {
      return { success: false, error: "Forbidden: Only store owners can add staff members." };
    }

    const tenantInfo = profile.tenants as unknown as {
      subscription_status?: string;
      subscription_plans?: { name: string; max_staff: number };
    } | null;

    if (tenantInfo?.subscription_status === "suspended") {
      return { success: false, error: "Store subscription is currently suspended." };
    }

    const maxStaffAllowed = tenantInfo?.subscription_plans?.max_staff || 1;

    const { count: currentStaffCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    if (currentStaffCount !== null && currentStaffCount >= maxStaffAllowed + 1) {
      return {
        success: false,
        error: `Staff capacity limit reached (${maxStaffAllowed} members) on the ${tenantInfo?.subscription_plans?.name || "current"} plan. Upgrade your plan to add more staff.`,
      };
    }

    const validated = CreateStaffSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const statelessClient = createStatelessClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { data: authData, error: createError } = await statelessClient.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        data: {
          full_name: validated.data.fullName,
        },
      },
    });

    if (createError || !authData.user) {
      return { success: false, error: createError?.message || "Failed to create staff user account." };
    }

    const { error: insertProfileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        tenant_id: profile.tenant_id,
        role_id: validated.data.role_id,
        full_name: validated.data.fullName,
        is_super_admin: false,
      });

    if (insertProfileError) {
      return { success: false, error: "Failed to map staff profile." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred while adding staff." };
  }
}

export async function deleteStaffAction(staffId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, roles:role_id (can_manage_users)")
      .eq("id", user.id)
      .single();

    if (profileError || !currentProfile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = currentProfile.roles as unknown as { can_manage_users?: boolean } | null;
    if (!permissions?.can_manage_users) {
      return { success: false, error: "Forbidden: Only store owners can delete staff." };
    }

    if (staffId === user.id) {
      return { success: false, error: "Store owner account cannot be deleted." };
    }

    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, role_id, tenant_id, full_name")
      .eq("id", staffId)
      .single();

    if (targetError || !targetProfile) {
      return { success: false, error: "Staff member not found." };
    }

    if (targetProfile.tenant_id !== currentProfile.tenant_id) {
      return { success: false, error: "Unauthorized operation across store boundaries." };
    }

    if (targetProfile.role_id === "owner") {
      return { success: false, error: "Primary owner account cannot be removed." };
    }

    const { count: salesCount, error: countError } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("cashier_id", staffId);

    if (countError) {
      return { success: false, error: "Failed to check cashier sales records." };
    }

    if (salesCount && salesCount > 0) {
      return {
        success: false,
        error: `Cannot delete staff member "${targetProfile.full_name}" because they have ${salesCount} recorded transaction(s). Required for sales audit history.`,
      };
    }

    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", staffId)
      .eq("tenant_id", currentProfile.tenant_id);

    if (deleteError) {
      return { success: false, error: "Failed to remove staff profile." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred while deleting staff." };
  }
}
