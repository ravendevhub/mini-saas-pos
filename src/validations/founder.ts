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
