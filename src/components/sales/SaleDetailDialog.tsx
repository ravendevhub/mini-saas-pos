"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { SaleWithDetails } from "@/types";
import { Printer } from "lucide-react";

interface SaleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleWithDetails | null;
}

export function SaleDetailDialog({ open, onOpenChange, sale }: SaleDetailDialogProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-4 sm:p-6 bg-white border-slate-200">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Receipt #{sale.id.substring(0, 8).toUpperCase()}
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] capitalize border-slate-200">
              {sale.payment_method.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500">
            {formatDateTime(sale.created_at)} • Cashier: {sale.cashier?.full_name || "Staff"}
          </p>
        </DialogHeader>

        <div className="border-t border-b border-dashed border-slate-200 py-3 my-2 space-y-2 max-h-56 overflow-y-auto">
          {sale.sale_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-medium text-slate-800 truncate">
                  {item.product?.name || "Product"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <span className="font-mono font-medium text-slate-800 tabular-nums">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-baseline pt-1">
          <span className="text-xs font-semibold text-slate-700">Total Charged</span>
          <span className="text-base font-mono font-bold text-slate-900 tabular-nums">
            {formatCurrency(sale.total_amount)}
          </span>
        </div>

        <DialogFooter className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="w-full text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
