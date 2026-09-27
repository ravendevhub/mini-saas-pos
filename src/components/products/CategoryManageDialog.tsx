"use client";

import { useState } from "react";
import { Category } from "@/types";
import { createCategoryAction, deleteCategoryAction } from "@/actions/products";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";

interface CategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  shopCode: string;
  onCategoriesChange: (categories: Category[]) => void;
}

export function CategoryManageDialog({
  open,
  onOpenChange,
  categories,
  shopCode,
  onCategoriesChange,
}: CategoryManageDialogProps) {
  const [newCatName, setNewCatName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsPending(true);
    try {
      const res = await createCategoryAction({
        name: newCatName.trim(),
        shopCode,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to add category.");
        return;
      }

      onCategoriesChange([...categories, res.data]);
      setNewCatName("");
      toast.success(`Category "${res.data.name}" added successfully.`);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deletingId) return;

    setIsPending(true);
    try {
      const res = await deleteCategoryAction(deletingId, shopCode);
      if (!res.success) {
        toast.error(res.error || "Failed to delete category.");
        return;
      }

      onCategoriesChange(categories.filter((c) => c.id !== deletingId));
      toast.success("Category deleted.");
      setDeletingId(null);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-4 sm:p-6 bg-white border-slate-200">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              Manage Product Categories
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create and manage categories to classify your store inventory and filter POS items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                placeholder="New category name (e.g. Dairy, Drinks)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-9 text-xs flex-1"
                required
              />
              <Button
                type="submit"
                disabled={isPending || !newCatName.trim()}
                className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 px-3"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </>
                )}
              </Button>
            </form>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <span className="text-[11px] font-medium text-slate-500 block">Existing Categories ({categories.length})</span>
              {categories.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded">
                  No categories created yet. Add one above.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-medium">
                          {cat.name}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(cat.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-slate-900">
              Delete this category?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Products in this category will remain in your catalog but become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            >
              {isPending ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
