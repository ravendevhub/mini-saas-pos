"use server";

import { createClient } from "@/lib/supabase/server";
import { ProductSchema } from "@/validations/product";
import { ActionResponse, Product } from "@/types";
import { revalidatePath } from "next/cache";

export async function createProductAction(formData: unknown): Promise<ActionResponse<Product>> {
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
        roles:role_id (can_manage_products),
        tenants:tenant_id (
          subscription_status,
          subscription_plans:plan_id (name, max_products)
        )
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = profile.roles as unknown as { can_manage_products?: boolean } | null;
    if (!permissions?.can_manage_products) {
      return { success: false, error: "Forbidden: You lack permission to manage products." };
    }

    const tenantInfo = profile.tenants as unknown as {
      subscription_status?: string;
      subscription_plans?: { name: string; max_products: number };
    } | null;

    if (tenantInfo?.subscription_status === "suspended") {
      return { success: false, error: "Store subscription is currently suspended." };
    }

    const maxProductsAllowed = tenantInfo?.subscription_plans?.max_products || 30;

    const { count: currentProductCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    if (currentProductCount !== null && currentProductCount >= maxProductsAllowed) {
      return {
        success: false,
        error: `Catalog limit of ${maxProductsAllowed} items reached on the ${tenantInfo?.subscription_plans?.name || "current"} plan. Upgrade plan to add more items.`,
      };
    }

    const validated = ProductSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    if (validated.data.sku) {
      const { data: existingSku } = await supabase
        .from("products")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("sku", validated.data.sku)
        .maybeSingle();

      if (existingSku) {
        return { success: false, error: "SKU already exists in your store catalog." };
      }
    }

    const { data, error: insertError } = await supabase
      .from("products")
      .insert({
        tenant_id: profile.tenant_id,
        name: validated.data.name,
        sku: validated.data.sku || null,
        price: validated.data.price,
        stock_quantity: validated.data.stock_quantity,
        image_url: validated.data.image_url || null,
        is_active: validated.data.is_active,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: "Failed to create product. Please try again." };
    }

    revalidatePath("/", "layout");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateProductAction(
  productId: string,
  formData: unknown
): Promise<ActionResponse<Product>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, roles:role_id (can_manage_products)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = profile.roles as unknown as { can_manage_products?: boolean } | null;
    if (!permissions?.can_manage_products) {
      return { success: false, error: "Forbidden: You lack permission to manage products." };
    }

    const validated = ProductSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    if (validated.data.sku) {
      const { data: existingSku } = await supabase
        .from("products")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("sku", validated.data.sku)
        .neq("id", productId)
        .maybeSingle();

      if (existingSku) {
        return { success: false, error: "SKU already exists in your store catalog." };
      }
    }

    const { data, error: updateError } = await supabase
      .from("products")
      .update({
        name: validated.data.name,
        sku: validated.data.sku || null,
        price: validated.data.price,
        stock_quantity: validated.data.stock_quantity,
        image_url: validated.data.image_url || null,
        is_active: validated.data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: "Failed to update product." };
    }

    revalidatePath("/", "layout");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, roles:role_id (can_manage_products)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = profile.roles as unknown as { can_manage_products?: boolean } | null;
    if (!permissions?.can_manage_products) {
      return { success: false, error: "Forbidden: You lack permission to delete products." };
    }

    const { count, error: countError } = await supabase
      .from("sale_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

    if (countError) {
      return { success: false, error: "Failed to verify product sale history." };
    }

    if (count && count > 0) {
      const { error: archiveError } = await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("tenant_id", profile.tenant_id);

      if (archiveError) {
        return { success: false, error: "Failed to archive product." };
      }

      revalidatePath("/", "layout");
      return { success: true, data: { archived: true } };
    } else {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("tenant_id", profile.tenant_id);

      if (deleteError) {
        return { success: false, error: "Failed to delete product." };
      }

      revalidatePath("/", "layout");
      return { success: true, data: { archived: false } };
    }
  } catch (err) {
    return { success: false, error: "An unexpected error occurred." };
  }
}
