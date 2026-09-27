import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, shop_code")
    .eq("shop_code", shopCode)
    .single();

  if (!tenant) {
    notFound();
  }

  const [allSalesRes, saleItemsRes] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total_amount, payment_method, created_at, cashier:cashier_id (full_name)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sale_items")
      .select("id, sale_id, quantity, subtotal, product:product_id (id, name, sku), sales!inner(tenant_id)")
      .eq("sales.tenant_id", tenant.id),
  ]);

  const sales = (allSalesRes.data || []).map((s) => ({
    id: s.id,
    total_amount: Number(s.total_amount),
    payment_method: s.payment_method,
    created_at: s.created_at,
    cashier: s.cashier as unknown as { full_name: string } | null,
  }));

  const saleItems = (saleItemsRes.data || []).map((i) => ({
    id: i.id,
    sale_id: i.sale_id,
    quantity: Number(i.quantity),
    subtotal: Number(i.subtotal),
    product: i.product as unknown as { id: string; name: string; sku: string | null } | null,
  }));

  return <ReportsView sales={sales} saleItems={saleItems} />;
}
