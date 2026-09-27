"use server";

import { createClient } from "@/lib/supabase/server";
import { ProductSchema, CategorySchema } from "@/validations/product";
import { ActionResponse, Product, Category } from "@/types";
import { revalidatePath } from "next/cache";

async function resolveTenantAndAuth(shopCode?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { supabase, user: null, profile: null, tenantId: null, isSuperAdmin: false, error: "Authentication required." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      tenant_id,
      is_super_admin,
      roles:role_id (
        can_manage_products,
        can_view_products,
        can_create_products,
        can_edit_products,
        can_delete_products
      ),
      tenants:tenant_id (
        id,
        subscription_status,
        subscription_plans:plan_id (name, max_products)
      )
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { supabase, user, profile: null, tenantId: null, isSuperAdmin: false, error: "Unauthorized: Profile not found." };
  }

  let tenantId = profile.tenant_id;
  let tenantInfo = profile.tenants as unknown as {
    id?: string;
    subscription_status?: string;
    subscription_plans?: { name: string; max_products: number };
  } | null;

  if (profile.is_super_admin) {
    if (shopCode) {
      const { data: storeTenant } = await supabase
        .from("tenants")
        .select("id, subscription_status, subscription_plans:plan_id(name, max_products)")
        .eq("shop_code", shopCode)
        .single();
      if (storeTenant) {
        tenantId = storeTenant.id;
        tenantInfo = storeTenant as unknown as {
          id?: string;
          subscription_status?: string;
          subscription_plans?: { name: string; max_products: number };
        };
      }
    }

    if (!tenantId) {
      const { data: fallbackTenant } = await supabase
        .from("tenants")
        .select("id, subscription_status, subscription_plans:plan_id(name, max_products)")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      if (fallbackTenant) {
        tenantId = fallbackTenant.id;
        tenantInfo = fallbackTenant as unknown as {
          id?: string;
          subscription_status?: string;
          subscription_plans?: { name: string; max_products: number };
        };
      }
    }
  }

  return {
    supabase,
    user,
    profile,
    tenantId,
    tenantInfo,
    isSuperAdmin: Boolean(profile.is_super_admin),
    error: null,
  };
}

export async function getCategoriesAction(shopCode?: string): Promise<ActionResponse<Category[]>> {
  try {
    const { supabase, tenantId, error } = await resolveTenantAndAuth(shopCode);
    if (error || !tenantId) {
      return { success: false, error: error || "Failed to resolve store." };
    }

    const { data, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });

    if (catError) {
      return { success: false, error: "Failed to load categories." };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: "An unexpected error occurred loading categories." };
  }
}

export async function createCategoryAction(formData: unknown): Promise<ActionResponse<Category>> {
  try {
    const validated = CategorySchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const { supabase, tenantId, profile, isSuperAdmin, error } = await resolveTenantAndAuth(validated.data.shopCode);
    if (error || !tenantId) {
      return { success: false, error: error || "Unauthorized." };
    }

    const permissions = profile?.roles as unknown as { can_create_products?: boolean } | null;
    if (!permissions?.can_create_products && !isSuperAdmin) {
      return { success: false, error: "Forbidden: You lack permission to create categories." };
    }

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("name", validated.data.name.trim())
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A category with this name already exists in your store." };
    }

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        tenant_id: tenantId,
        name: validated.data.name.trim(),
      })
      .select()
      .single();

    if (insertError || !data) {
      return { success: false, error: "Failed to create category." };
    }

    revalidatePath("/", "layout");
    return { success: true, data };
  } catch {
    return { success: false, error: "An unexpected error occurred creating category." };
  }
}

export async function deleteCategoryAction(categoryId: string, shopCode?: string): Promise<ActionResponse> {
  try {
    const { supabase, tenantId, profile, isSuperAdmin, error } = await resolveTenantAndAuth(shopCode);
    if (error || !tenantId) {
      return { success: false, error: error || "Unauthorized." };
    }

    const permissions = profile?.roles as unknown as { can_delete_products?: boolean } | null;
    if (!permissions?.can_delete_products && !isSuperAdmin) {
      return { success: false, error: "Forbidden: You lack permission to delete categories." };
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("tenant_id", tenantId);

    if (deleteError) {
      return { success: false, error: "Failed to delete category." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred deleting category." };
  }
}

export async function createProductAction(formData: unknown): Promise<ActionResponse<Product>> {
  try {
    const validated = ProductSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const { supabase, tenantId, tenantInfo, profile, isSuperAdmin, error } = await resolveTenantAndAuth(validated.data.shopCode);
    if (error || !tenantId) {
      return { success: false, error: error || "Failed to identify store tenant." };
    }

    const permissions = profile?.roles as unknown as { can_create_products?: boolean } | null;
    if (!permissions?.can_create_products && !isSuperAdmin) {
      return { success: false, error: "Forbidden: You lack permission to create products." };
    }

    if (tenantInfo?.subscription_status === "suspended") {
      return { success: false, error: "Store subscription is currently suspended." };
    }

    const maxProductsAllowed = tenantInfo?.subscription_plans?.max_products || 30;

    const { count: currentProductCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (currentProductCount !== null && currentProductCount >= maxProductsAllowed) {
      return {
        success: false,
        error: `Catalog limit of ${maxProductsAllowed} items reached on the ${tenantInfo?.subscription_plans?.name || "current"} plan. Upgrade plan to add more items.`,
      };
    }

    if (validated.data.sku) {
      const { data: existingSku } = await supabase
        .from("products")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("sku", validated.data.sku)
        .maybeSingle();

      if (existingSku) {
        return { success: false, error: "SKU already exists in your store catalog." };
      }
    }

    const { data, error: insertError } = await supabase
      .from("products")
      .insert({
        tenant_id: tenantId,
        category_id: validated.data.category_id || null,
        name: validated.data.name,
        sku: validated.data.sku || null,
        price: validated.data.price,
        stock_quantity: validated.data.stock_quantity,
        image_url: validated.data.image_url || null,
        is_active: validated.data.is_active,
      })
      .select("*, categories(*)")
      .single();

    if (insertError || !data) {
      return { success: false, error: insertError?.message || "Failed to create product. Please try again." };
    }

    revalidatePath("/", "layout");
    return { success: true, data: data as unknown as Product };
  } catch {
    return { success: false, error: "An unexpected error occurred saving product." };
  }
}

export async function updateProductAction(
  productId: string,
  formData: unknown
): Promise<ActionResponse<Product>> {
  try {
    const validated = ProductSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
    }

    const { supabase, tenantId, profile, isSuperAdmin, error } = await resolveTenantAndAuth(validated.data.shopCode);
    if (error || !tenantId) {
      return { success: false, error: error || "Failed to identify store tenant." };
    }

    const permissions = profile?.roles as unknown as { can_edit_products?: boolean } | null;
    if (!permissions?.can_edit_products && !isSuperAdmin) {
      return { success: false, error: "Forbidden: You lack permission to edit products." };
    }

    if (validated.data.sku) {
      const { data: existingSku } = await supabase
        .from("products")
        .select("id")
        .eq("tenant_id", tenantId)
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
        category_id: validated.data.category_id || null,
        name: validated.data.name,
        sku: validated.data.sku || null,
        price: validated.data.price,
        stock_quantity: validated.data.stock_quantity,
        image_url: validated.data.image_url || null,
        is_active: validated.data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .select("*, categories(*)")
      .single();

    if (updateError || !data) {
      return { success: false, error: updateError?.message || "Failed to update product." };
    }

    revalidatePath("/", "layout");
    return { success: true, data: data as unknown as Product };
  } catch {
    return { success: false, error: "An unexpected error occurred updating product." };
  }
}

export async function deleteProductAction(productId: string, shopCode?: string): Promise<ActionResponse> {
  try {
    const { supabase, tenantId, profile, isSuperAdmin, error } = await resolveTenantAndAuth(shopCode);
    if (error || !tenantId) {
      return { success: false, error: error || "Failed to identify store tenant." };
    }

    const permissions = profile?.roles as unknown as { can_delete_products?: boolean } | null;
    if (!permissions?.can_delete_products && !isSuperAdmin) {
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
        .eq("tenant_id", tenantId);

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
        .eq("tenant_id", tenantId);

      if (deleteError) {
        return { success: false, error: "Failed to delete product." };
      }

      revalidatePath("/", "layout");
      return { success: true, data: { archived: false } };
    }
  } catch {
    return { success: false, error: "An unexpected error occurred deleting product." };
  }
}
