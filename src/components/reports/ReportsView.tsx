"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { DollarSign, ShoppingBag, Package, TrendingUp, CreditCard, Calendar, Filter, RotateCcw } from "lucide-react";

interface ReportSaleItem {
  id: string;
  sale_id: string;
  quantity: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

interface ReportSale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  cashier?: {
    full_name: string;
  } | null;
}

interface ReportsViewProps {
  sales: ReportSale[];
  saleItems: ReportSaleItem[];
}

export function ReportsView({ sales, saleItems }: ReportsViewProps) {
  const [filterType, setFilterType] = useState<"all" | "today" | "yesterday" | "week" | "month" | "custom">("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredSales = useMemo(() => {
    const now = new Date();

    if (filterType === "all") {
      return sales;
    }

    if (filterType === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return sales.filter((s) => new Date(s.created_at) >= start);
    }

    if (filterType === "yesterday") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      return sales.filter((s) => {
        const d = new Date(s.created_at);
        return d >= start && d <= end;
      });
    }

    if (filterType === "week") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
      return sales.filter((s) => new Date(s.created_at) >= start);
    }

    if (filterType === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return sales.filter((s) => new Date(s.created_at) >= start);
    }

    if (filterType === "custom") {
      return sales.filter((s) => {
        const itemDate = new Date(s.created_at);
        if (fromDate) {
          const from = new Date(`${fromDate}T00:00:00`);
          if (itemDate < from) return false;
        }
        if (toDate) {
          const to = new Date(`${toDate}T23:59:59`);
          if (itemDate > to) return false;
        }
        return true;
      });
    }

    return sales;
  }, [sales, filterType, fromDate, toDate]);

  const filteredSaleIds = useMemo(() => {
    return new Set(filteredSales.map((s) => s.id));
  }, [filteredSales]);

  const filteredSaleItems = useMemo(() => {
    if (filterType === "all") return saleItems;
    return saleItems.filter((i) => filteredSaleIds.has(i.sale_id));
  }, [saleItems, filteredSaleIds, filterType]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalOrders = filteredSales.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = filteredSaleItems.reduce((sum, i) => sum + Number(i.quantity), 0);

  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  filteredSales.forEach((sale) => {
    const method = sale.payment_method || "cash";
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, total: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].total += Number(sale.total_amount);
  });

  const productAggregates: Record<
    string,
    { name: string; sku: string | null; totalQuantity: number; totalRevenue: number }
  > = {};

  filteredSaleItems.forEach((item) => {
    if (!item.product) return;
    if (!productAggregates[item.product.id]) {
      productAggregates[item.product.id] = {
        name: item.product.name,
        sku: item.product.sku,
        totalQuantity: 0,
        totalRevenue: 0,
      };
    }
    productAggregates[item.product.id].totalQuantity += Number(item.quantity);
    productAggregates[item.product.id].totalRevenue += Number(item.subtotal);
  });

  const topProducts = Object.values(productAggregates)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 8);

  function handleResetFilters() {
    setFilterType("today");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Financial Reports</h1>
        <p className="text-xs text-slate-500">
          Realtime aggregated sales performance, payment channels, and inventory movement.
        </p>
      </div>

      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter Period:
            </span>
            {(
              [
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "week", label: "Last 7 Days" },
                { id: "month", label: "This Month" },
                { id: "all", label: "All Time" },
                { id: "custom", label: "Custom Range" },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setFilterType(preset.id)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterType === preset.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {(filterType !== "today" || fromDate || toDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs h-7 text-slate-500 hover:text-slate-900 gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>

        {filterType === "custom" && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">From:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 text-xs w-36 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">To:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 text-xs w-36 font-mono"
              />
            </div>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-mono">
              {filteredSales.length} Transactions
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Period Revenue</CardTitle>
            <div className="w-8 h-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 capitalize">
              In selected {filterType === "custom" ? "custom range" : filterType}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Orders Processed</CardTitle>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {totalOrders.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Completed sale receipts</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Items Dispensed</CardTitle>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {totalItemsSold.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Units deducted from stock</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Average Order Value</CardTitle>
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Per transaction ticket</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Payment Channels Breakdown
            </CardTitle>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {Object.keys(paymentBreakdown).length} methods
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {Object.keys(paymentBreakdown).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No payment transactions in this period.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-700">Method</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-center">Orders</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(paymentBreakdown).map(([method, data]) => (
                    <TableRow key={method} className="border-slate-100">
                      <TableCell className="py-2.5 font-medium text-slate-900 text-xs capitalize">
                        {method.replace("_", " ")}
                      </TableCell>
                      <TableCell className="py-2.5 text-center font-mono text-xs tabular-nums text-slate-600">
                        {data.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-semibold text-slate-900 text-xs tabular-nums">
                        {formatCurrency(data.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Top Moving Inventory
            </CardTitle>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              Ranked by quantity
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No item sales recorded in this period.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-700">Product</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-center">Qty Sold</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((prod, idx) => (
                    <TableRow key={idx} className="border-slate-100">
                      <TableCell className="py-2.5 text-xs">
                        <span className="font-medium text-slate-900 block">{prod.name}</span>
                        {prod.sku && <span className="text-[10px] text-slate-400 font-mono">{prod.sku}</span>}
                      </TableCell>
                      <TableCell className="py-2.5 text-center font-mono text-xs tabular-nums text-slate-700 font-semibold">
                        {prod.totalQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-semibold text-slate-900 text-xs tabular-nums">
                        {formatCurrency(prod.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
