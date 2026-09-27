"use server";

import { createClient } from "@/lib/supabase/server";
import { SubmitSubscriptionRequestSchema } from "@/validations/founder";
import { ActionResponse, FounderPaymentMethod, SubscriptionPaymentRequest } from "@/types";
import { revalidatePath } from "next/cache";

export async function getActivePaymentMethodsAction(): Promise<ActionResponse<FounderPaymentMethod[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("founder_payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return { success: false, error: "Failed to load payment accounts." };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: "An unexpected error occurred loading payment accounts." };
  }
}

export async function getStoreSubscriptionRequestsAction(tenantId: string): Promise<ActionResponse<SubscriptionPaymentRequest[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized access." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "User profile not found." };
    }

    if (profile.tenant_id !== tenantId && !profile.is_super_admin) {
      return { success: false, error: "Forbidden: Cross-tenant data access is not permitted." };
    }

    const { data, error } = await supabase
      .from("subscription_payment_requests")
      .select("*, subscription_plans(*)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: "Failed to load subscription requests." };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function submitSubscriptionRequestAction(formData: unknown): Promise<ActionResponse<{ requestId: string }>> {
  try {
    const validated = SubmitSubscriptionRequestSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation failed." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, is_super_admin, role_id, tenants(shop_code)")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "User profile not found." };
    }

    let targetTenantId = profile.tenant_id;
    let targetShopCode = (profile.tenants as unknown as { shop_code?: string })?.shop_code;

    if (profile.is_super_admin) {
      if (validated.data.shopCode) {
        const { data: storeTenant } = await supabase
          .from("tenants")
          .select("id, shop_code")
          .eq("shop_code", validated.data.shopCode)
          .single();
        if (storeTenant) {
          targetTenantId = storeTenant.id;
          targetShopCode = storeTenant.shop_code;
        }
      }

      if (!targetTenantId) {
        const { data: fallbackTenant } = await supabase
          .from("tenants")
          .select("id, shop_code")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        if (fallbackTenant) {
          targetTenantId = fallbackTenant.id;
          targetShopCode = fallbackTenant.shop_code;
        }
      }
    }

    if (!targetTenantId) {
      return { success: false, error: "Store tenant not found." };
    }

    const { data: existingPending } = await supabase
      .from("subscription_payment_requests")
      .select("id")
      .eq("tenant_id", targetTenantId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return {
        success: false,
        error: "This store already has a pending subscription change request awaiting Founder approval.",
      };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("subscription_payment_requests")
      .insert({
        tenant_id: targetTenantId,
        requested_plan_id: validated.data.requested_plan_id,
        payment_method_id: validated.data.payment_method_id || null,
        payment_method_name: validated.data.payment_method_name,
        sender_name: validated.data.sender_name,
        sender_phone: validated.data.sender_phone,
        transaction_ref: validated.data.transaction_ref || null,
        slip_url: validated.data.slip_url,
        amount: validated.data.amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { success: false, error: "Failed to submit subscription request. Please try again." };
    }

    if (targetShopCode) {
      revalidatePath(`/${targetShopCode}/settings`);
    }
    revalidatePath("/founder");

    return { success: true, data: { requestId: inserted.id } };
  } catch {
    return { success: false, error: "An unexpected error occurred while submitting your payment request." };
  }
}
