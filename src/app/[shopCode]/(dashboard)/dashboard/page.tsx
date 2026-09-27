import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Receipt,
  Plus
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
    .select("total_amount")
    .eq("tenant_id", tenant.id)
    .gte("created_at", todayStart.toISOString());

  const todayRevenue = (todaySales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const todayOrdersCount = todaySales?.length || 0;

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
    .limit(6);

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
    .limit(6);

  const planInfo = tenant.subscription_plans as unknown as {
    name: string;
    max_products: number;
    max_staff: number;
  } | null;

  return (
    <div className="space-y-6 w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{tenant.name}</h1>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              {planInfo?.name || "Free"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store Performance & Daily Retail Operations Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${shopCode}/products`}>
            <Button variant="outline" size="sm" className="text-xs h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Product
            </Button>
          </Link>
          <Link href={`/${shopCode}/pos`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9">
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Open POS Terminal
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
              <span>{todayOrdersCount} {todayOrdersCount === 1 ? "order" : "orders"} today</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Total Lifetime Sales</CardTitle>
            <div className="w-8 h-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalOrdersCount} lifetime completed sales
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Active Products</CardTitle>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeProductCount || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Of {planInfo?.max_products || 30} allowed items
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
              {lowStockCount > 0 ? "Products needing restock" : "All items well stocked"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
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
              No sales transactions recorded yet.
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

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
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
                      {p.stock_quantity <= 0 ? "Out of Stock" : `${p.stock_quantity} remaining`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
