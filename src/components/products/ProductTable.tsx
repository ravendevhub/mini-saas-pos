"use client";

import { useState } from "react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductFormDialog } from "./ProductFormDialog";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { Search, Plus, Edit2, Trash2, Package } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  canManage: boolean;
}

export function ProductTable({ products, canManage }: ProductTableProps) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchName = p.name.toLowerCase().includes(q);
    const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
    return matchName || matchSku;
  });

  function handleCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function handleEdit(product: Product) {
    setEditTarget(product);
    setFormOpen(true);
  }

  function handleDelete(product: Product) {
    setDeleteTarget(product);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No matching products" : "No products in catalog"}
          description={
            search
              ? "Try adjusting your search criteria."
              : "Start by adding your first product to begin selling."
          }
          actionLabel={canManage && !search ? "Add Product" : undefined}
          onAction={canManage && !search ? handleCreate : undefined}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-700">Product</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">SKU</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Price</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Stock</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
                {canManage && (
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const isOutOfStock = product.stock_quantity <= 0;
                const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

                return (
                  <TableRow key={product.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="py-2.5 font-medium text-slate-900 text-xs">
                      {product.name}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-500 font-mono">
                      {product.sku || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs font-mono font-medium text-slate-900 text-right tabular-nums">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-center font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isOutOfStock
                            ? "text-red-600"
                            : isLowStock
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      {!product.is_active ? (
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                          Archived
                        </Badge>
                      ) : isOutOfStock ? (
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                          Out of stock
                        </Badge>
                      ) : isLowStock ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Low stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          In stock
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productToEdit={editTarget}
      />

      <DeleteProductDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        product={deleteTarget}
      />
    </div>
  );
}
