"use client";

import { Product } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
}

export function ProductCard({ product, onAddToCart, cartQuantity }: ProductCardProps) {
  const isOutOfStock = product.stock_quantity <= 0;
  const isMaxInCart = cartQuantity >= product.stock_quantity;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <button
      type="button"
      disabled={isOutOfStock || isMaxInCart}
      onClick={() => onAddToCart(product)}
      className={`group text-left p-3 rounded-lg border bg-white flex flex-col justify-between transition-all duration-150 h-32 select-none relative ${
        isOutOfStock
          ? "border-slate-200 opacity-50 cursor-not-allowed bg-slate-50"
          : isMaxInCart
          ? "border-amber-300 bg-amber-50/20 cursor-not-allowed"
          : "border-slate-200 hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/10 active:scale-[0.97] cursor-pointer"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
            {product.name}
          </h4>
          {cartQuantity > 0 && (
            <span className="shrink-0 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartQuantity}
            </span>
          )}
        </div>
        {product.sku && (
          <p className="text-[10px] text-slate-400 font-mono truncate">{product.sku}</p>
        )}
      </div>

      <div className="flex items-end justify-between pt-2 border-t border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
            {formatCurrency(product.price)}
          </span>
          <div className="text-[10px] font-mono tabular-nums">
            {isOutOfStock ? (
              <span className="text-red-600 font-medium">Out of stock</span>
            ) : isLowStock ? (
              <span className="text-amber-600 font-medium">{product.stock_quantity} left</span>
            ) : (
              <span className="text-slate-500">{product.stock_quantity} in stock</span>
            )}
          </div>
        </div>

        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-150">
          <Plus className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
}
