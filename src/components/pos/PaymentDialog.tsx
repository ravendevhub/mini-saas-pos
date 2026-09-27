"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { PAYMENT_METHODS } from "@/lib/constants";
import { CreditCard, Banknote, QrCode, Loader2 } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  itemCount: number;
  isProcessing: boolean;
  onConfirm: (method: "cash" | "card" | "qr_transfer") => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  itemCount,
  isProcessing,
  onConfirm,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "card" | "qr_transfer">("cash");

  const methodIcons = {
    cash: Banknote,
    card: CreditCard,
    qr_transfer: QrCode,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-4 sm:p-6 bg-white border-slate-200">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Payment Checkout
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select customer payment method to complete the order.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600">Total Due ({itemCount} items)</span>
            <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = methodIcons[method.id as keyof typeof methodIcons] || Banknote;
                const isSelected = selectedMethod === method.id;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id as "cash" | "card" | "qr_transfer")}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[11px] leading-tight">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessing}
            onClick={() => onOpenChange(false)}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={() => onConfirm(selectedMethod)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Charge ${formatCurrency(totalAmount)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
