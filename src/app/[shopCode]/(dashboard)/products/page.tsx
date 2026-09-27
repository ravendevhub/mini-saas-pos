import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "@/components/products/ProductTable";
import { Product } from "@/types";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, roles:role_id (can_manage_products)")
    .eq("id", user?.id || "")
    .single();

  const permissions = profile?.roles as unknown as { can_manage_products?: boolean } | null;
  const canManage = Boolean(permissions?.can_manage_products);

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Product Catalog</h1>
        <p className="text-xs text-slate-500">
          Manage inventory, prices, and stock availability across your store.
        </p>
      </div>

      <ProductTable products={(products || []) as Product[]} canManage={canManage} />
    </div>
  );
}
