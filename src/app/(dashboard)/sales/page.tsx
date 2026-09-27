import { createClient } from "@/lib/supabase/server";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleWithDetails } from "@/types";

export default async function SalesPage() {
  const supabase = await createClient();

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
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
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
