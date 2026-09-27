"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema, RegisterTenantSchema } from "@/validations/auth";
import { ActionResponse } from "@/types";
import { redirect } from "next/navigation";

export interface LoginResult {
  isSuperAdmin: boolean;
  shopCode?: string;
}

export async function loginAction(formData: unknown): Promise<ActionResponse<LoginResult>> {
  try {
    const validated = LoginSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || "Invalid credentials." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin, tenant_id, tenants:tenant_id (shop_code, subscription_status)")
      .eq("id", authData.user.id)
      .single();

    if (profile?.is_super_admin) {
      return {
        success: true,
        data: { isSuperAdmin: true },
      };
    }

    const tenant = profile?.tenants as unknown as { shop_code?: string; subscription_status?: string } | null;
    const shopCode = tenant?.shop_code;

    if (!shopCode) {
      return { success: false, error: "Store association not found." };
    }

    return {
      success: true,
      data: {
        isSuperAdmin: false,
        shopCode,
      },
    };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

export async function registerTenantAction(
  formData: unknown
): Promise<ActionResponse<{ shopCode: string }>> {
  try {
    const validated = RegisterTenantSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const supabase = await createClient();

    const normalizedShopCode = validated.data.shopCode.toLowerCase().trim();

    const { data: existingShop } = await supabase
      .from("tenants")
      .select("id")
      .eq("shop_code", normalizedShopCode)
      .maybeSingle();

    if (existingShop) {
      return { success: false, error: "This shop code is already registered. Please choose another one." };
    }

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

    const slug = normalizedShopCode;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: validated.data.storeName,
        slug,
        shop_code: normalizedShopCode,
        plan_id: "free",
        subscription_status: "active",
        subscription_expires_at: expiryDate.toISOString(),
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: "Failed to create store record." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        role_id: "owner",
        full_name: validated.data.fullName,
        is_super_admin: false,
      });

    if (profileError) {
      return { success: false, error: "Failed to establish store owner profile." };
    }

    return {
      success: true,
      data: { shopCode: normalizedShopCode },
    };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred during registration." };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
