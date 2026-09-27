import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120),
  sku: z.string().trim().max(50).optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0").max(1000000000, "Price exceeds allowable limit"),
  stock_quantity: z.coerce.number().int().nonnegative("Stock cannot be negative").max(1000000, "Stock exceeds allowable limit"),
  image_url: z.string().trim().url("Invalid image URL").max(2048).optional().nullable().or(z.literal("")),
  category_id: z.string().trim().uuid("Invalid category ID").optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
  shopCode: z.string().trim().optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(50),
  shopCode: z.string().trim().optional(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

