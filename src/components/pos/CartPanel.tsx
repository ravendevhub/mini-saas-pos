"use client";

import { CartItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartPanelProps) {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-900">Current Order</h3>
          <span className="text-[10px] font-mono bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
            {totalItemsCount}
          </span>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="text-[11px] h-7 px-2 text-slate-500 hover:text-red-600"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100 min-h-[220px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-700">Cart is empty</p>
            <p className="text-[10px] text-slate-400 max-w-[180px] mt-0.5">
              Select products from the catalog to build an order.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {item.product.name}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatCurrency(item.product.price)} each
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                  className="h-6 w-6 p-0 text-slate-600 border-slate-200"
                >
                  <Minus className="w-3 h-3" />
                  <span className="sr-only">Decrease</span>
                </Button>
                <span className="text-xs font-mono font-bold w-6 text-center tabular-nums text-slate-900">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={item.quantity >= item.product.stock_quantity}
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className="h-6 w-6 p-0 text-slate-600 border-slate-200"
                >
                  <Plus className="w-3 h-3" />
                  <span className="sr-only">Increase</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-mono font-semibold text-slate-900 tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>
        <div className="flex justify-between items-baseline text-sm font-bold text-slate-900 pt-1 border-t border-slate-200/60">
          <span>Total</span>
          <span className="font-mono text-base text-indigo-600 tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <Button
          size="sm"
          disabled={items.length === 0}
          onClick={onCheckout}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs mt-1"
        >
          <span>Charge {formatCurrency(totalAmount)}</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
