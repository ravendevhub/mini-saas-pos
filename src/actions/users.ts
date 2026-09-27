"use server";

import { createClient } from "@/lib/supabase/server";
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

    const { data: authData, error: createError } = await supabase.auth.signUp({
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

    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred while adding staff." };
  }
}
