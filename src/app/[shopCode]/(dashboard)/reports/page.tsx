import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, ShoppingBag, Package, TrendingUp, CreditCard } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todaySales } = await supabase
    .from("sales")
    .select("total_amount")
    .gte("created_at", todayStart.toISOString());

  const todayRevenue = (todaySales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const todayOrdersCount = todaySales?.length || 0;

  const { data: allSales } = await supabase
    .from("sales")
    .select("total_amount, payment_method, cashier:cashier_id (full_name)");

  const totalRevenue = (allSales || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalOrdersCount = allSales?.length || 0;

  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  allSales?.forEach((sale) => {
    const method = sale.payment_method || "cash";
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, total: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].total += Number(sale.total_amount);
  });

  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("quantity, subtotal, product:product_id (id, name, sku)");

  const productAggregates: Record<string, { name: string; sku: string | null; totalQuantity: number; totalRevenue: number }> = {};

  saleItems?.forEach((item) => {
    const prod = item.product as unknown as { id: string; name: string; sku: string | null } | null;
    if (!prod) return;
    if (!productAggregates[prod.id]) {
      productAggregates[prod.id] = {
        name: prod.name,
        sku: prod.sku,
        totalQuantity: 0,
        totalRevenue: 0,
      };
    }
    productAggregates[prod.id].totalQuantity += Number(item.quantity);
    productAggregates[prod.id].totalRevenue += Number(item.subtotal);
  });

  const topProducts = Object.values(productAggregates)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Financial Reports</h1>
        <p className="text-xs text-slate-500">
          Realtime aggregated sales performance and inventory movement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Today&apos;s Revenue</CardTitle>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(todayRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">From {todayOrdersCount} completed sales</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Today&apos;s Orders</CardTitle>
            <div className="w-7 h-7 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {todayOrdersCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Avg ticket: {formatCurrency(todayOrdersCount ? todayRevenue / todayOrdersCount : 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">All-Time Revenue</CardTitle>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{totalOrdersCount} lifetime orders</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Payment Breakdown</CardTitle>
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-1">
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400">No payment data yet</p>
            ) : (
              Object.entries(paymentBreakdown).map(([method, data]) => (
                <div key={method} className="flex justify-between text-[11px]">
                  <span className="capitalize text-slate-600">{method.replace("_", " ")}</span>
                  <span className="font-mono font-medium text-slate-800 tabular-nums">
                    {formatCurrency(data.total)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Top Selling Products</h3>
          </div>
          <span className="text-xs text-slate-500">Ranked by volume sold</span>
        </div>

        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No sales recorded yet to generate top selling rankings.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-700">Rank</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Product</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">SKU</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Units Sold</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((item, idx) => (
                <TableRow key={item.name} className="border-slate-100">
                  <TableCell className="py-2.5 text-xs font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-medium text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-500 font-mono">
                    {item.sku || "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-mono font-semibold text-slate-900 text-center tabular-nums">
                    {item.totalQuantity}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-mono font-bold text-slate-900 text-right tabular-nums">
                    {formatCurrency(item.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
