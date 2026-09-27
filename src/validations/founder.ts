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

export const FounderPaymentMethodSchema = z.object({
  id: z.string().uuid().optional(),
  provider_name: z.string().min(2, "Provider name must be at least 2 characters"),
  account_name: z.string().min(2, "Account name must be at least 2 characters"),
  account_number: z.string().min(2, "Account number must be at least 2 characters"),
  qr_code_url: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

export const ReviewSubscriptionRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().trim().max(500).optional(),
});

export const SubmitSubscriptionRequestSchema = z.object({
  requested_plan_id: z.string().trim().min(1, "Plan selection is required"),
  payment_method_id: z.string().uuid().nullable().optional(),
  payment_method_name: z.string().trim().min(1, "Payment method is required").max(100),
  sender_name: z.string().trim().min(2, "Sender name must be at least 2 characters").max(100),
  sender_phone: z.string().trim().min(5, "Sender phone must be at least 5 digits").max(30),
  transaction_ref: z.string().trim().max(100).nullable().optional(),
  slip_url: z.string().trim().min(5, "Payment slip screenshot is required"),
  amount: z.number().min(0),
  shopCode: z.string().trim().optional(),
});

