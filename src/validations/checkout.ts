import { z } from "zod";

export const CartItemPayloadSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
});

export const CheckoutPayloadSchema = z.object({
  items: z.array(CartItemPayloadSchema).min(1, "Cart cannot be empty"),
  payment_method: z.enum(["cash", "card", "qr_transfer"]).default("cash"),
  shopCode: z.string().optional(),
});

export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;
