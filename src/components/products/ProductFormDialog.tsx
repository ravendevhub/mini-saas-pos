"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Product } from "@/types";
import { createProductAction, updateProductAction } from "@/actions/products";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, productToEdit }: ProductFormDialogProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku || "");
      setPrice(productToEdit.price.toString());
      setStockQuantity(productToEdit.stock_quantity.toString());
      setIsActive(productToEdit.is_active);
    } else {
      setName("");
      setSku("");
      setPrice("");
      setStockQuantity("0");
      setIsActive(true);
    }
    setErrorMessage(null);
  }, [productToEdit, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const payload = {
      name,
      sku: sku.trim() || null,
      price: parseFloat(price) || 0,
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      is_active: isActive,
    };

    try {
      const res = productToEdit
        ? await updateProductAction(productToEdit.id, payload)
        : await createProductAction(payload);

      if (!res.success) {
        setErrorMessage(res.error || "Operation failed.");
      } else {
        toast.success(productToEdit ? "Product updated." : "Product created.");
        onOpenChange(false);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6 bg-white border-slate-200">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {productToEdit ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {productToEdit ? "Update inventory item specifications." : "Add a new item to the store catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <ErrorBanner message={errorMessage} />

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700" htmlFor="prod-name">
              Product Name *
            </label>
            <Input
              id="prod-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Whole Milk"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700" htmlFor="prod-sku">
              SKU / Barcode
            </label>
            <Input
              id="prod-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. MLK-001"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="prod-price">
                Price ($) *
              </label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4.50"
                className="h-9 tabular-nums font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="prod-stock">
                Stock Quantity *
              </label>
              <Input
                id="prod-stock"
                type="number"
                step="1"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="50"
                className="h-9 tabular-nums font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="prod-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="prod-active" className="text-xs font-medium text-slate-700">
              Active in catalog
            </label>
          </div>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
