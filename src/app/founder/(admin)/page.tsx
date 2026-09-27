import { getFounderStatsAction, getFounderTenantsAction } from "@/actions/founder";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FounderTenantsTable } from "@/components/founder/FounderTenantsTable";
import { Store, DollarSign, CheckCircle2, ShoppingBag } from "lucide-react";

export default async function FounderAdminPage() {
  const statsRes = await getFounderStatsAction();
  const tenantsRes = await getFounderTenantsAction();

  const stats = statsRes.data || {
    totalTenants: 0,
    activeTenants: 0,
    platformTotalRevenue: 0,
    platformTotalOrders: 0,
  };

  const tenants = tenantsRes.data || [];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">Platform Overview</h2>
        <p className="text-xs text-slate-500">
          Global multi-tenant metrics, customer store subscriptions, and plan allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Total Stores</CardTitle>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalTenants}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Registered businesses</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Active Stores</CardTitle>
            <div className="w-8 h-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.activeTenants}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">In good standing</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Platform Gross Sales</CardTitle>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(stats.platformTotalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all merchant terminals</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Processed Orders</CardTitle>
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.platformTotalOrders}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Completed checkout receipts</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Registered Merchant Stores</h3>
        <FounderTenantsTable tenants={tenants} />
      </div>
    </div>
  );
}
