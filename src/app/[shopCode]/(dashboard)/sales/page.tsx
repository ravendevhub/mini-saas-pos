import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleWithDetails } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SalesPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("shop_code", shopCode)
    .single();

  if (!tenant) {
    notFound();
  }

  const { data: sales } = await supabase
    .from("sales")
    .select(`
      *,
      cashier:cashier_id (id, full_name, role_id),
      sale_items (
        id,
        quantity,
        unit_price,
        subtotal,
        product:product_id (id, name, sku)
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Sales History</h1>
        <p className="text-xs text-slate-500">
          Review completed receipts, cashier records, and itemized customer orders.
        </p>
      </div>

      <SalesTable sales={(sales || []) as unknown as SaleWithDetails[]} />
    </div>
  );
}
