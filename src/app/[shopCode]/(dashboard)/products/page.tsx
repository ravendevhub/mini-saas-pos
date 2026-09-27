import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "@/components/products/ProductTable";
import { Product, Category } from "@/types";
import { ShieldAlert } from "lucide-react";

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

  const { data: profile } = await supabase
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
      )
    `)
    .eq("id", user?.id || "")
    .single();

  const permissions = profile?.roles as unknown as {
    can_manage_products?: boolean;
    can_view_products?: boolean;
    can_create_products?: boolean;
    can_edit_products?: boolean;
    can_delete_products?: boolean;
  } | null;

  const isSuperAdmin = Boolean(profile?.is_super_admin);
  const canView = Boolean(permissions?.can_view_products || permissions?.can_manage_products || isSuperAdmin);
  const canCreate = Boolean(permissions?.can_create_products || permissions?.can_manage_products || isSuperAdmin);
  const canEdit = Boolean(permissions?.can_edit_products || permissions?.can_manage_products || isSuperAdmin);
  const canDelete = Boolean(permissions?.can_delete_products || permissions?.can_manage_products || isSuperAdmin);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg max-w-md mx-auto my-12">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          You do not have permission to view the product catalog.
        </p>
      </div>
    );
  }

  const [productsRes, categoriesRes] = await Promise.all([
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

  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];

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
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
