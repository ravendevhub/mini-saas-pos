"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { SaleWithDetails } from "@/types";
import { SaleDetailDialog } from "./SaleDetailDialog";
import { Receipt, Search, Eye, Filter, RotateCcw, Calendar } from "lucide-react";

interface SalesTableProps {
  sales: SaleWithDetails[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [filterType, setFilterType] = useState<"all" | "today" | "yesterday" | "week" | "month" | "custom">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.payment_method) set.add(s.payment_method);
    });
    return Array.from(set);
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const q = search.toLowerCase().trim();
      if (q) {
        const matchId = sale.id.toLowerCase().includes(q);
        const matchCashier = sale.cashier?.full_name?.toLowerCase().includes(q) || false;
        const matchMethod = sale.payment_method.toLowerCase().includes(q);
        if (!matchId && !matchCashier && !matchMethod) return false;
      }

      if (methodFilter !== "all" && sale.payment_method !== methodFilter) {
        return false;
      }

      const saleDate = new Date(sale.created_at);
      const now = new Date();

      if (filterType === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        return saleDate >= start;
      }

      if (filterType === "yesterday") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        return saleDate >= start && saleDate <= end;
      }

      if (filterType === "week") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
        return saleDate >= start;
      }

      if (filterType === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return saleDate >= start;
      }

      if (filterType === "custom") {
        if (fromDate) {
          const from = new Date(`${fromDate}T00:00:00`);
          if (saleDate < from) return false;
        }
        if (toDate) {
          const to = new Date(`${toDate}T23:59:59`);
          if (saleDate > to) return false;
        }
        return true;
      }

      return true;
    });
  }, [sales, search, methodFilter, filterType, fromDate, toDate]);

  const filteredTotal = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + Number(s.total_amount), 0);
  }, [filteredSales]);

  const hasActiveFilters = search || filterType !== "all" || methodFilter !== "all" || fromDate || toDate;

  function handleReset() {
    setSearch("");
    setFilterType("all");
    setFromDate("");
    setToDate("");
    setMethodFilter("all");
  }

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter Period:
            </span>
            {(
              [
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "week", label: "Last 7 Days" },
                { id: "month", label: "This Month" },
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

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs h-7 text-slate-500 hover:text-slate-900 gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </Button>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, cashier, method..."
                className="pl-8 h-8 text-xs"
              />
            </div>

            {paymentMethods.length > 0 && (
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Payment Methods</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            )}

            {filterType === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">From:</span>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 text-xs w-36 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">To:</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 text-xs w-36 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Found <strong className="text-slate-900 font-mono tabular-nums">{filteredSales.length}</strong> orders
            </span>
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs">
              <span className="text-slate-500 mr-1">Total:</span>
              <strong className="text-slate-900 font-mono font-semibold tabular-nums">
                {formatCurrency(filteredTotal)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasActiveFilters ? "No matching orders found" : "No sales recorded yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search criteria or date filter range."
              : "Completed transactions will appear here in chronological order."
          }
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-700">Receipt ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Date & Time</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Cashier</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Method</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Total</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="py-2.5 text-xs font-mono font-medium text-slate-900">
                    #{sale.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-500">
                    {formatDateTime(sale.created_at)}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-700">
                    {sale.cashier?.full_name || "Staff"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs">
                    <Badge variant="outline" className="text-[10px] capitalize border-slate-200">
                      {sale.payment_method.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-mono font-semibold text-slate-900 text-right tabular-nums">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSale(sale)}
                      className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaleDetailDialog
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
        sale={selectedSale}
      />
    </div>
  );
}
