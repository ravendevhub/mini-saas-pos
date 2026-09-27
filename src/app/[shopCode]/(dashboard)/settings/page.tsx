import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, CreditCard, Package, Users, CheckCircle2, Receipt } from "lucide-react";
import { TenantWithPlan } from "@/types";
import { getActivePaymentMethodsAction, getStoreSubscriptionRequestsAction } from "@/actions/subscription";
import { PlanUpgradeDialog } from "@/components/settings/PlanUpgradeDialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select(`
      *,
      subscription_plans:plan_id (*)
    `)
    .eq("shop_code", shopCode)
    .single();

  if (!tenant) notFound();

  const typedTenant = tenant as unknown as TenantWithPlan;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    productCountRes, 
    staffCountRes, 
    allPlansRes, 
    monthSalesRes,
    paymentMethodsRes,
    requestsRes
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", typedTenant.id),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", typedTenant.id),
    supabase
      .from("subscription_plans")
      .select("*")
      .order("price_per_month", { ascending: true }),
    supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", typedTenant.id)
      .gte("created_at", monthStart.toISOString()),
    getActivePaymentMethodsAction(),
    getStoreSubscriptionRequestsAction(typedTenant.id),
  ]);

  const productCount = productCountRes.count;
  const staffCount = staffCountRes.count;
  const allPlans = allPlansRes.data;
  const monthSalesCount = monthSalesRes.count || 0;
  const paymentMethods = paymentMethodsRes.data || [];
  const requests = requestsRes.data || [];
  const pendingRequest = requests.find((r) => r.status === "pending") || null;

  const currentPlan = typedTenant.subscription_plans;
  const maxProducts = currentPlan?.max_products || 30;
  const maxStaff = currentPlan?.max_staff || 1;
  const maxOrders = currentPlan?.max_orders_per_month || 500;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Store & Subscription</h1>
        <p className="text-xs text-slate-500">
          Overview of your store identifiers, plan tier limits, and subscription renewal status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">Store Profile</CardTitle>
              <CardDescription className="text-xs text-slate-500">Public identifiers for this terminal</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Store Name</span>
              <span className="font-semibold text-slate-900">{typedTenant.name}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Shop Code URL</span>
              <span className="font-mono font-medium text-indigo-600">/{typedTenant.shop_code}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Store ID</span>
              <span className="font-mono text-slate-400 text-[10px]">{typedTenant.id}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Registration Date</span>
              <span className="text-slate-700">{formatDateTime(typedTenant.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">Current Subscription</CardTitle>
              <CardDescription className="text-xs text-slate-500">Tier capacity and billing status</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5 items-center">
              <span className="text-slate-500">Active Plan</span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold capitalize">
                {currentPlan?.name || typedTenant.plan_id} ({formatCurrency(currentPlan?.price_per_month || 0)}/mo)
              </Badge>
            </div>
            <div className="flex justify-between py-1.5 items-center">
              <span className="text-slate-500">Status</span>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${
                  typedTenant.subscription_status === "active"
                    ? "bg-green-50 text-green-700 border-green-200 font-medium"
                    : "bg-red-50 text-red-700 border-red-200 font-medium"
                }`}
              >
                {typedTenant.subscription_status}
              </Badge>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Renews / Expires At</span>
              <span className="font-mono text-slate-800">
                {typedTenant.subscription_expires_at ? formatDateTime(typedTenant.subscription_expires_at) : "Never"}
              </span>
            </div>
            <div className="py-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-400" /> Catalog Capacity
                </span>
                <span className="font-mono font-medium text-slate-900">
                  {productCount || 0} / {maxProducts} items
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (((productCount || 0) / maxProducts) * 100))}%` }}
                />
              </div>
            </div>
            <div className="py-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Staff Seats
                </span>
                <span className="font-mono font-medium text-slate-900">
                  {staffCount || 0} / {maxStaff} seats
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (((staffCount || 0) / maxStaff) * 100))}%` }}
                />
              </div>
            </div>
            <div className="py-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" /> Monthly Vouchers (vr)
                </span>
                <span className="font-mono font-medium text-slate-900">
                  {monthSalesCount || 0} / {maxOrders.toLocaleString()} vouchers
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((monthSalesCount / maxOrders) * 100))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Available Subscription Plans</h2>
        <PlanUpgradeDialog
          currentPlanId={typedTenant.plan_id}
          plans={allPlans || []}
          paymentMethods={paymentMethods}
          pendingRequest={pendingRequest}
          shopCode={shopCode}
        />
      </div>
    </div>
  );
}

