import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "@/components/products/ProductTable";
import { Product, Category } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const [userRes, tenantRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tenants")
      .select("id")
      .eq("shop_code", shopCode)
      .single(),
  ]);

  const user = userRes.data?.user;
  const tenant = tenantRes.data;

  if (!tenant) {
    notFound();
  }

  const [profileRes, productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("tenant_id, is_super_admin, roles:role_id (can_manage_products)")
      .eq("id", user?.id || "")
      .single(),
    supabase
      .from("products")
      .select("*, categories(*)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];

  const permissions = profile?.roles as unknown as { can_manage_products?: boolean } | null;
  const canManage = Boolean(permissions?.can_manage_products || profile?.is_super_admin);

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Product Catalog</h1>
        <p className="text-xs text-slate-500">
          Manage inventory, prices, categories, and stock availability across your store.
        </p>
      </div>

      <ProductTable
        products={(products || []) as unknown as Product[]}
        categories={(categories || []) as Category[]}
        shopCode={shopCode}
        canManage={canManage}
      />
    </div>
  );
}
