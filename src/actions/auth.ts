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

    const { data: isAvailable } = await supabase.rpc("check_shop_code_available", {
      p_shop_code: normalizedShopCode,
    });

    if (isAvailable === false) {
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

    const { error: rpcError } = await supabase.rpc("register_store", {
      p_store_name: validated.data.storeName,
      p_shop_code: normalizedShopCode,
      p_full_name: validated.data.fullName,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message || "Failed to establish store record." };
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
