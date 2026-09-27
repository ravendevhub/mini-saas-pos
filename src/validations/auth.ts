import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterTenantSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100),
  shopCode: z
    .string()
    .min(2, "Shop code must be at least 2 characters")
    .max(30, "Shop code cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Shop code can only contain lowercase letters, numbers, and hyphens"),
  fullName: z.string().min(2, "Your full name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterTenantInput = z.infer<typeof RegisterTenantSchema>;

export const CreateStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role_id: z.enum(["manager", "cashier"]),
  shopCode: z.string().optional(),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
