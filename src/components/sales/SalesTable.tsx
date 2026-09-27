"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { SaleWithDetails } from "@/types";
import { SaleDetailDialog } from "./SaleDetailDialog";
import { Receipt, Search, Eye } from "lucide-react";

interface SalesTableProps {
  sales: SaleWithDetails[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

  const filteredSales = sales.filter((sale) => {
    const q = search.toLowerCase();
    const matchId = sale.id.toLowerCase().includes(q);
    const matchCashier = sale.cashier?.full_name?.toLowerCase().includes(q) || false;
    const matchMethod = sale.payment_method.toLowerCase().includes(q);
    return matchId || matchCashier || matchMethod;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, cashier, or method..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={search ? "No matching orders" : "No sales recorded yet"}
          description={
            search
              ? "Try searching for a different receipt ID or cashier name."
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
