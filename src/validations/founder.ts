import { z } from "zod";

export const UpdateTenantPlanSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  planId: z.enum(["free", "starter", "pro"]),
});

export const UpdateTenantStatusSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  status: z.enum(["active", "suspended", "expired"]),
});

export const ExtendSubscriptionSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  daysToAdd: z.number().int().positive("Days must be positive"),
});

export const UpdateSubscriptionPlanSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  name: z.string().min(2, "Plan name must be at least 2 characters"),
  price_per_month: z.number().min(0, "Price must be 0 or higher"),
  max_products: z.number().int().positive("Product limit must be greater than 0"),
  max_staff: z.number().int().positive("Staff limit must be greater than 0"),
  max_orders_per_month: z.number().int().positive("Monthly voucher limit must be greater than 0"),
  can_view_reports: z.boolean().default(true),
});
