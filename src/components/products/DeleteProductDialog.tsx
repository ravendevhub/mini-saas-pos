"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product } from "@/types";
import { deleteProductAction } from "@/actions/products";
import { toast } from "sonner";

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
  const [isPending, setIsPending] = useState(false);

  if (!product) return null;

  async function handleConfirm() {
    if (!product) return;
    setIsPending(true);

    try {
      const res = await deleteProductAction(product.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete product.");
      } else {
        const archived = (res.data as { archived?: boolean })?.archived;
        if (archived) {
          toast.success("Product has past sales history and was archived.");
        } else {
          toast.success("Product deleted successfully.");
        }
        onOpenChange(false);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border-slate-200 max-w-sm p-4 sm:p-6">
        <AlertDialogHeader className="text-left space-y-1">
          <AlertDialogTitle className="text-base font-semibold text-slate-900">
            Delete Product?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-600">
            Are you sure you want to remove &quot;{product.name}&quot;? Items with prior sales history will be deactivated instead of removed to protect sales records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
          <AlertDialogCancel disabled={isPending} className="text-xs h-8">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
          >
            {isPending ? "Processing..." : "Confirm Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
