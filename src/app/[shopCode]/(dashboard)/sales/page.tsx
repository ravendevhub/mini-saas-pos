import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleWithDetails } from "@/types";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SalesPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [tenantRes, profileRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id")
      .eq("shop_code", shopCode)
      .single(),
    supabase
      .from("profiles")
      .select(`
        tenant_id,
        is_super_admin,
        role_id,
        roles:role_id (
          can_view_reports
        )
      `)
      .eq("id", user?.id || "")
      .single(),
  ]);

  const tenant = tenantRes.data;
  const profile = profileRes.data;

  if (!tenant) {
    notFound();
  }

  const permissions = profile?.roles as unknown as {
    can_view_reports?: boolean;
  } | null;

  const isSuperAdmin = Boolean(profile?.is_super_admin);
  const isOwner = profile?.role_id === "owner";
  const canView = Boolean(isSuperAdmin || isOwner || permissions?.can_view_reports);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg max-w-md mx-auto my-12">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          You do not have permission to view sales transaction history.
        </p>
      </div>
    );
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
