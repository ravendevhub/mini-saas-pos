import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveActionLogCard } from "@/components/dashboard/LiveActionLogCard";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Receipt,
  Plus,
  CreditCard,
  QrCode,
  Banknote,
  Users,
  Award,
  BarChart3,
  ShieldCheck
} from "lucide-react";

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select(`
      id,
      name,
      shop_code,
      plan_id,
      subscription_status,
      subscription_expires_at,
      subscription_plans:plan_id (name, max_products, max_staff)
    `)
    .eq("shop_code", shopCode)
    .single();

  if (!tenant) {
    notFound();
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todaySales } = await supabase
    .from("sales")
    .select("total_amount, payment_method")
    .eq("tenant_id", tenant.id)
    .gte("created_at", todayStart.toISOString());

  const todayRevenue = (todaySales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const todayOrdersCount = todaySales?.length || 0;

  const paymentBreakdown = {
    cash: { count: 0, amount: 0 },
    card: { count: 0, amount: 0 },
    qr_transfer: { count: 0, amount: 0 },
  };

  (todaySales || []).forEach((s) => {
    const method = s.payment_method as keyof typeof paymentBreakdown;
    if (paymentBreakdown[method]) {
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].amount += Number(s.total_amount);
    }
  });

  const { data: allSales } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("tenant_id", tenant.id);

  const totalRevenue = (allSales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalOrdersCount = allSales?.length || 0;

  const { count: activeProductCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("is_active", true);

  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .lte("stock_quantity", 5)
    .order("stock_quantity", { ascending: true })
    .limit(5);

  const lowStockCount = lowStockProducts?.length || 0;

  const { data: recentSales } = await supabase
    .from("sales")
    .select(`
      id,
      total_amount,
      payment_method,
      created_at,
      profiles:cashier_id (full_name)
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: rawSaleItems } = await supabase
    .from("sale_items")
    .select(`
      quantity,
      subtotal,
      product:product_id (name, sku)
    `)
    .limit(100);

  const productAggregates: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
  (rawSaleItems || []).forEach((item) => {
    const prod = item.product as unknown as { name?: string; sku?: string } | null;
    if (!prod?.name) return;
    if (!productAggregates[prod.name]) {
      productAggregates[prod.name] = { name: prod.name, sku: prod.sku || "", quantity: 0, revenue: 0 };
    }
    productAggregates[prod.name].quantity += Number(item.quantity);
    productAggregates[prod.name].revenue += Number(item.subtotal);
  });

  const topProducts = Object.values(productAggregates)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const { data: storeStaff } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      roles:role_id (name)
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true });

  const staffCount = storeStaff?.length || 1;

  const planInfo = tenant.subscription_plans as unknown as {
    name: string;
    max_products: number;
    max_staff: number;
  } | null;

  const maxProducts = planInfo?.max_products || 30;
  const maxStaff = planInfo?.max_staff || 1;

  const expiryDate = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : null;
  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{tenant.name}</h1>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              {planInfo?.name || "Free"}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${
                tenant.subscription_status === "active"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {tenant.subscription_status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store Performance, Operational Logs & Daily Retail Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${shopCode}/reports`}>
            <Button variant="outline" size="sm" className="text-xs h-9">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Reports
            </Button>
          </Link>
          <Link href={`/${shopCode}/products`}>
            <Button variant="outline" size="sm" className="text-xs h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Product
            </Button>
          </Link>
          <Link href={`/${shopCode}/pos`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9">
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Today&apos;s Revenue</CardTitle>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(todayRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>{todayOrdersCount} {todayOrdersCount === 1 ? "sale" : "sales"} rung up today</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Lifetime Gross Sales</CardTitle>
            <div className="w-8 h-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalOrdersCount} completed store orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Active Catalog Items</CardTitle>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeProductCount || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round(((activeProductCount || 0) / maxProducts) * 100)}% of {maxProducts} plan capacity
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Inventory Alerts</CardTitle>
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`text-2xl font-bold font-mono tabular-nums ${
              lowStockCount > 0 ? "text-amber-600" : "text-slate-900"
            }`}>
              {lowStockCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lowStockCount > 0 ? "Items needing replenishment" : "All catalog items well stocked"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Today&apos;s Payment Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-green-100 text-green-700 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">Cash Tender</p>
                <p className="text-[11px] text-slate-400">{paymentBreakdown.cash.count} receipts</p>
              </div>
            </div>
            <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
              {formatCurrency(paymentBreakdown.cash.amount)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">Card Payment</p>
                <p className="text-[11px] text-slate-400">{paymentBreakdown.card.count} receipts</p>
              </div>
            </div>
            <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
              {formatCurrency(paymentBreakdown.card.amount)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">QR / Transfer</p>
                <p className="text-[11px] text-slate-400">{paymentBreakdown.qr_transfer.count} receipts</p>
              </div>
            </div>
            <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
              {formatCurrency(paymentBreakdown.qr_transfer.amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
                <p className="text-xs text-slate-500">Latest sales orders rung up at your store</p>
              </div>
              <Link href={`/${shopCode}/sales`}>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 h-8">
                  View All
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {(!recentSales || recentSales.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No sales transactions recorded yet. Open POS to start selling.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map((sale) => {
                  const cashier = sale.profiles as unknown as { full_name?: string } | null;
                  return (
                    <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-800">
                            #{sale.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize bg-slate-50 text-slate-600">
                            {sale.payment_method.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(sale.created_at)} • {cashier?.full_name || "Cashier"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(sale.total_amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Top Selling Products</h2>
                <p className="text-xs text-slate-500">Highest volume items by total units sold</p>
              </div>
              <Link href={`/${shopCode}/reports`}>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 h-8">
                  View Analysis
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No items sold yet. Ring up orders in POS to track best sellers.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topProducts.map((p, index) => (
                  <div key={p.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">{p.sku || "No SKU"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-900 tabular-nums">
                        {p.quantity} units
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 tabular-nums">
                        {formatCurrency(p.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <LiveActionLogCard />

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Inventory Attention</h2>
                <p className="text-xs text-slate-500">Low stock and depleted items</p>
              </div>
              <Link href={`/${shopCode}/products`}>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 h-8">
                  Manage
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {(!lowStockProducts || lowStockProducts.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No low stock items. All catalog stock quantities are healthy.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">{p.sku || "No SKU"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono tabular-nums ${
                          p.stock_quantity <= 0
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.stock_quantity <= 0 ? "Out of Stock" : `${p.stock_quantity} left`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Store Capacity & Health</h2>
              <Link href={`/${shopCode}/settings`}>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 h-7 px-2">
                  Settings
                </Button>
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Product Catalog Quota</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    {activeProductCount || 0} / {maxProducts}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(((activeProductCount || 0) / maxProducts) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Staff Team Quota</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    {staffCount} / {maxStaff}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((staffCount / maxStaff) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Subscription Status
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {daysRemaining !== null ? `${daysRemaining} days remaining` : "Ongoing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
