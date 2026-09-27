---
name: backend-database-security
description: >-
  Provides backend architecture patterns, Supabase SSR client configurations, Server Action templates,
  Zod validation schemas, multi-tenant RLS policies, and atomic checkout RPC functions for Next.js App Router.
  Use when writing database queries, building Server Actions, setting up migrations, or verifying tenant isolation.
---

# Backend, Database & Security Engineering Skill

This skill enforces strict standards for Next.js App Router backend logic, Supabase database migrations, Row Level Security (RLS), atomic POS transactions, and multi-tenant security.

---

## 1. Supabase SSR Server Client Pattern

Always use `@supabase/ssr` with Next.js cookie handling:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

---

## 2. Server Action Secure Mutation Pattern

Every mutation must follow strict server-side authentication, tenant resolution from user profile, role validation, and Zod parsing:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sku: z.string().max(50).optional().nullable(),
  price: z.number().positive("Price must be greater than 0"),
  stock_quantity: z.number().int().nonnegative("Stock cannot be negative"),
});

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createProductAction(formData: unknown): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, roles(can_manage_products)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Unauthorized: Profile not found." };
    }

    const permissions = profile.roles as { can_manage_products?: boolean } | null;
    if (!permissions?.can_manage_products) {
      return { success: false, error: "Forbidden: You lack permission to manage products." };
    }

    const validated = ProductSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { data, error: insertError } = await supabase
      .from("products")
      .insert({
        tenant_id: profile.tenant_id,
        name: validated.data.name,
        sku: validated.data.sku,
        price: validated.data.price,
        stock_quantity: validated.data.stock_quantity,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[DB Error createProduct]:", insertError);
      return { success: false, error: "Failed to create product. Please try again." };
    }

    revalidatePath("/products");
    return { success: true, data };
  } catch (err) {
    console.error("[Unexpected Error createProduct]:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
```

---

## 3. Product Deletion Lifecycle Standard

Never delete a product without checking its sales history:

```typescript
export async function deleteProductAction(productId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { count, error: countError } = await supabase
    .from("sale_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  if (countError) {
    console.error("[DB Error checkSaleItems]:", countError);
    return { success: false, error: "Failed to verify product history." };
  }

  if (count && count > 0) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (error) return { success: false, error: "Failed to archive product." };
    revalidatePath("/products");
    return { success: true };
  } else {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) return { success: false, error: "Failed to delete product." };
    revalidatePath("/products");
    return { success: true };
  }
}
```

---

## 4. Atomic POS Checkout RPC Execution

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const CheckoutPayloadSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart cannot be empty"),
  payment_method: z.string().default("cash"),
});

export async function checkoutSaleAction(payload: unknown) {
  try {
    const validated = CheckoutPayloadSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_sale", {
      p_items: validated.data.items,
      p_payment_method: validated.data.payment_method,
    });

    if (error) {
      console.error("[RPC Error create_sale]:", error);
      return { success: false, error: error.message || "Checkout failed." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Checkout Exception]:", err);
    return { success: false, error: "Transaction failed. Please try again." };
  }
}
```

---

## 5. Security & Isolation Checklist

- Verify `tenant_id` is never accepted from client body without server-side validation against `auth.uid()`.
- Search codebase for `SUPABASE_SERVICE_ROLE_KEY` or `service_role`. Verify it is NEVER referenced in client components or exposed via `NEXT_PUBLIC_`.
- Verify `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY` is run on all 6 tables.
- Test checkout with insufficient stock to confirm database rolls back completely (no orphan sales or partial deductions).
- Verify that when a database query fails, the user receives clean, user-friendly messages instead of Postgres error codes.
