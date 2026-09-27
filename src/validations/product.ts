import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(120),
  sku: z.string().max(50).optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  stock_quantity: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  image_url: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof ProductSchema>;
