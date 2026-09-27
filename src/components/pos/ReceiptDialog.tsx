"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { CartItem } from "@/types";
import { CheckCircle2, Printer } from "lucide-react";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  onNewSale: () => void;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  saleId,
  items,
  totalAmount,
  paymentMethod,
  onNewSale,
}: ReceiptDialogProps) {
  function handlePrint() {
    window.print();
  }

  function handleComplete() {
    onOpenChange(false);
    onNewSale();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-4 sm:p-6 bg-white border-slate-200">
        <DialogHeader className="text-center space-y-1">
          <div className="flex justify-center mb-1">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <DialogTitle className="text-base font-semibold text-slate-900">
            Sale Completed
          </DialogTitle>
          <p className="text-[11px] font-mono text-slate-400 truncate">
            Receipt #{saleId?.substring(0, 8).toUpperCase()}
          </p>
          <p className="text-[10px] text-slate-400">
            {formatDateTime(new Date())}
          </p>
        </DialogHeader>

        <div className="border-t border-b border-dashed border-slate-200 py-3 my-2 space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {item.quantity} × {formatCurrency(item.product.price)}
                </p>
              </div>
              <span className="font-mono font-medium text-slate-800 tabular-nums">
                {formatCurrency(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Payment Method</span>
            <span className="capitalize font-medium text-slate-700">{paymentMethod.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Total Paid</span>
            <span className="font-mono tabular-nums">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="w-full text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Receipt
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleComplete}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          >
            New Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
