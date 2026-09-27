"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema, RegisterTenantSchema } from "@/validations/auth";
import { ActionResponse } from "@/types";
import { redirect } from "next/navigation";

export async function loginAction(formData: unknown): Promise<ActionResponse> {
  try {
    const validated = LoginSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

export async function registerTenantAction(formData: unknown): Promise<ActionResponse> {
  try {
    const validated = RegisterTenantSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        data: {
          full_name: validated.data.fullName,
        },
      },
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || "Failed to create account." };
    }

    const slug = validated.data.storeName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .concat("-", Math.random().toString(36).substring(2, 7));

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: validated.data.storeName,
        slug,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: "Failed to create tenant store." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        role_id: "owner",
        full_name: validated.data.fullName,
      });

    if (profileError) {
      return { success: false, error: "Failed to establish user profile." };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred during registration." };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
