"use client";

import { useState } from "react";
import { Product, CartItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { ProductCard } from "./ProductCard";
import { CartPanel } from "./CartPanel";
import { PaymentDialog } from "./PaymentDialog";
import { ReceiptDialog } from "./ReceiptDialog";
import { checkoutSaleAction } from "@/actions/checkout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, ShoppingBag, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { recordActionLog } from "@/lib/action-logger";

interface POSTerminalProps {
  products: Product[];
}

export function POSTerminal({ products }: POSTerminalProps) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    id: string;
    items: CartItem[];
    total: number;
    paymentMethod: string;
  } | null>(null);

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchName = p.name.toLowerCase().includes(q);
    const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
    return matchName || matchSku;
  });

  function handleAddToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.warning(`Maximum available stock reached for ${product.name}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function handleUpdateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock_quantity) {
              toast.warning(`Maximum available stock is ${item.product.stock_quantity}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function handleRemoveItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function handleClearCart() {
    setCart([]);
    recordActionLog({
      action: "Clear Cart",
      status: "success",
      details: "Current order cleared from terminal.",
    });
  }

  function handleInitiateCheckout() {
    if (cart.length === 0) return;
    setPaymentDialogOpen(true);
  }

  async function handleConfirmPayment(paymentMethod: "cash" | "card" | "qr_transfer") {
    setIsProcessing(true);

    const payload = {
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      payment_method: paymentMethod,
    };

    try {
      const res = await checkoutSaleAction(payload);
      if (!res.success) {
        toast.error(res.error || "Sale checkout failed.");
        recordActionLog({
          action: "Checkout Sale",
          status: "error",
          details: res.error || "Sale checkout transaction failed.",
        });
      } else {
        const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        const saleRef = res.data?.sale_id ? `#${res.data.sale_id.slice(0, 8).toUpperCase()}` : "SALE";
        setCompletedSale({
          id: res.data?.sale_id || "SALE",
          items: [...cart],
          total,
          paymentMethod,
        });

        setPaymentDialogOpen(false);
        setMobileCartOpen(false);
        setReceiptDialogOpen(true);
        toast.success(`Sale recorded (${formatCurrency(total)}).`);
        recordActionLog({
          action: "Checkout Sale",
          status: "success",
          details: `Order ${saleRef} confirmed for ${formatCurrency(total)} via ${paymentMethod.replace("_", " ").toUpperCase()}.`,
        });
      }
    } catch {
      toast.error("Network communication error.");
      recordActionLog({
        action: "Checkout Sale",
        status: "error",
        details: "Network connection error during checkout.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleNewSale() {
    setCart([]);
    setCompletedSale(null);
  }

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="space-y-4 w-full pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Point of Sale</h1>
          <p className="text-xs text-slate-500">Scan or select items to ring up customer sales.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or SKU..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-3 min-w-0">
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={search ? "No matching products found" : "No active products"}
              description={
                search
                  ? "Try searching with a different term."
                  : "Add products in the catalog to begin selling."
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id)?.quantity || 0;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    cartQuantity={inCart}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block lg:col-span-4 xl:col-span-4 2xl:col-span-3 sticky top-4 h-[calc(100vh-140px)] min-w-[280px]">
          <CartPanel
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleInitiateCheckout}
          />
        </div>
      </div>

      {totalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 flex items-center justify-between z-30 shadow-lg">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
            </p>
            <p className="text-sm font-mono font-bold text-indigo-600 tabular-nums">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setMobileCartOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            View Cart
          </Button>
        </div>
      )}

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col bg-white">
          <SheetHeader className="p-3 border-b border-slate-200 text-left">
            <SheetTitle className="text-sm font-semibold text-slate-900">Active Order</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-2">
            <CartPanel
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleInitiateCheckout}
            />
          </div>
        </SheetContent>
      </Sheet>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        totalAmount={totalAmount}
        itemCount={totalItemsCount}
        isProcessing={isProcessing}
        onConfirm={handleConfirmPayment}
      />

      <ReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        saleId={completedSale?.id || null}
        items={completedSale?.items || []}
        totalAmount={completedSale?.total || 0}
        paymentMethod={completedSale?.paymentMethod || "cash"}
        onNewSale={handleNewSale}
      />
    </div>
  );
}
