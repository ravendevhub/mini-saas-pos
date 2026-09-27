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
      .select("tenant_id, role_id, tenants(shop_code)")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.tenant_id) {
      return { success: false, error: "User profile or tenant not found." };
    }

    const { data: existingPending } = await supabase
      .from("subscription_payment_requests")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return {
        success: false,
        error: "You already have a pending subscription change request awaiting Founder approval.",
      };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("subscription_payment_requests")
      .insert({
        tenant_id: profile.tenant_id,
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

    const shopCode = (profile.tenants as unknown as { shop_code?: string })?.shop_code;
    if (shopCode) {
      revalidatePath(`/${shopCode}/settings`);
    }
    revalidatePath("/founder");

    return { success: true, data: { requestId: inserted.id } };
  } catch {
    return { success: false, error: "An unexpected error occurred while submitting your payment request." };
  }
}
