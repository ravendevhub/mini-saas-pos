"use server";

import { createClient } from "@/lib/supabase/server";
import { CheckoutPayloadSchema } from "@/validations/checkout";
import { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

export interface CheckoutResult {
  sale_id: string;
  total_amount: number;
}

export async function checkoutSaleAction(payload: unknown): Promise<ActionResponse<CheckoutResult>> {
  try {
    const validated = CheckoutPayloadSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, roles:role_id (can_create_sales)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = profile.roles as unknown as { can_create_sales?: boolean } | null;
    if (!permissions?.can_create_sales) {
      return { success: false, error: "Forbidden: You lack permission to perform sales." };
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_sale", {
      p_items: validated.data.items,
      p_payment_method: validated.data.payment_method,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message || "Checkout failed." };
    }

    const result = rpcResult as unknown as CheckoutResult;

    revalidatePath("/pos");
    revalidatePath("/products");
    revalidatePath("/sales");
    revalidatePath("/reports");

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    return { success: false, error: "Checkout transaction failed. Please try again." };
  }
}
