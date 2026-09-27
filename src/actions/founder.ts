"use server";

import { createClient } from "@/lib/supabase/server";
import { UpdateTenantPlanSchema, UpdateTenantStatusSchema, ExtendSubscriptionSchema } from "@/validations/founder";
import { LoginSchema } from "@/validations/auth";
import { ActionResponse, FounderTenantSummary, TenantWithPlan, Profile } from "@/types";
import { revalidatePath } from "next/cache";

async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, supabase, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  return {
    authorized: Boolean(profile?.is_super_admin),
    supabase,
    user,
  };
}

export async function getFounderStatsAction() {
  const { authorized, supabase } = await verifySuperAdmin();
  if (!authorized) {
    return { success: false, error: "Unauthorized access: Founder Admin privileges required." };
  }

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, subscription_status, plan_id");

  const totalTenants = tenants?.length || 0;
  const activeTenants = tenants?.filter((t) => t.subscription_status === "active").length || 0;

  const { data: sales } = await supabase
    .from("sales")
    .select("total_amount");

  const platformTotalRevenue = (sales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const platformTotalOrders = sales?.length || 0;

  return {
    success: true,
    data: {
      totalTenants,
      activeTenants,
      platformTotalRevenue,
      platformTotalOrders,
    },
  };
}

export async function getFounderTenantsAction(): Promise<ActionResponse<FounderTenantSummary[]>> {
  const { authorized, supabase } = await verifySuperAdmin();
  if (!authorized) {
    return { success: false, error: "Unauthorized access: Founder Admin privileges required." };
  }

  const { data: tenants } = await supabase
    .from("tenants")
    .select(`
      *,
      subscription_plans:plan_id (*)
    `)
    .order("created_at", { ascending: false });

  if (!tenants) {
    return { success: true, data: [] };
  }

  const summaries: FounderTenantSummary[] = [];

  for (const t of tenants) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", t.id)
      .eq("role_id", "owner")
      .maybeSingle();

    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", t.id);

    const { count: staffCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", t.id);

    const { data: tenantSales } = await supabase
      .from("sales")
      .select("total_amount")
      .eq("tenant_id", t.id);

    const revenue = (tenantSales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);

    summaries.push({
      tenant: t as unknown as TenantWithPlan,
      owner: owner as Profile | null,
      totalProducts: productCount || 0,
      totalStaff: staffCount || 0,
      totalSalesCount: tenantSales?.length || 0,
      totalRevenue: revenue,
    });
  }

  return { success: true, data: summaries };
}

export async function updateTenantPlanAction(formData: unknown): Promise<ActionResponse> {
  const { authorized, supabase } = await verifySuperAdmin();
  if (!authorized) {
    return { success: false, error: "Unauthorized access." };
  }

  const validated = UpdateTenantPlanSchema.safeParse(formData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
  }

  const { error } = await supabase
    .from("tenants")
    .update({ plan_id: validated.data.planId, updated_at: new Date().toISOString() })
    .eq("id", validated.data.tenantId);

  if (error) {
    return { success: false, error: "Failed to update store plan." };
  }

  revalidatePath("/founder");
  return { success: true };
}

export async function updateTenantStatusAction(formData: unknown): Promise<ActionResponse> {
  const { authorized, supabase } = await verifySuperAdmin();
  if (!authorized) {
    return { success: false, error: "Unauthorized access." };
  }

  const validated = UpdateTenantStatusSchema.safeParse(formData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
  }

  const { error } = await supabase
    .from("tenants")
    .update({ subscription_status: validated.data.status, updated_at: new Date().toISOString() })
    .eq("id", validated.data.tenantId);

  if (error) {
    return { success: false, error: "Failed to update store status." };
  }

  revalidatePath("/founder");
  return { success: true };
}

export async function extendSubscriptionAction(formData: unknown): Promise<ActionResponse> {
  const { authorized, supabase } = await verifySuperAdmin();
  if (!authorized) {
    return { success: false, error: "Unauthorized access." };
  }

  const validated = ExtendSubscriptionSchema.safeParse(formData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || "Validation error." };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("subscription_expires_at")
    .eq("id", validated.data.tenantId)
    .single();

  const currentExpiry = tenant?.subscription_expires_at
    ? new Date(tenant.subscription_expires_at)
    : new Date();

  const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
  baseDate.setDate(baseDate.getDate() + validated.data.daysToAdd);

  const { error } = await supabase
    .from("tenants")
    .update({
      subscription_expires_at: baseDate.toISOString(),
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", validated.data.tenantId);

  if (error) {
    return { success: false, error: "Failed to extend subscription." };
  }

  revalidatePath("/founder");
  return { success: true };
}

export async function founderLoginAction(formData: unknown): Promise<ActionResponse> {
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
      return { success: false, error: authError?.message || "Invalid founder credentials." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", authData.user.id)
      .single();

    if (!profile?.is_super_admin) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Access denied. Only platform founder administrators can access this portal.",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred during founder sign in." };
  }
}
