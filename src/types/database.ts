export interface SubscriptionPlan {
  id: "free" | "starter" | "pro" | string;
  name: string;
  price_per_month: number;
  max_products: number;
  max_staff: number;
  max_orders_per_month: number;
  can_view_reports: boolean;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  shop_code: string;
  plan_id: string;
  subscription_status: "active" | "suspended" | "expired";
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: "owner" | "manager" | "cashier";
  name: string;
  can_manage_users: boolean;
  can_manage_products: boolean;
  can_create_sales: boolean;
  can_view_reports: boolean;
  can_view_products: boolean;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  can_view_sales: boolean;
  can_delete_sales: boolean;
  can_view_users: boolean;
  can_create_users: boolean;
  can_delete_users: boolean;
}

export interface Profile {
  id: string;
  tenant_id: string;
  role_id: "owner" | "manager" | "cashier";
  full_name: string;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id?: string | null;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface Sale {
  id: string;
  tenant_id: string;
  cashier_id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ProfileWithRole extends Profile {
  roles: Role;
}

export interface TenantWithPlan extends Tenant {
  subscription_plans?: SubscriptionPlan;
}

export interface FounderPaymentMethod {
  id: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string | null;
  instructions: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPaymentRequest {
  id: string;
  tenant_id: string;
  requested_plan_id: string;
  payment_method_id: string | null;
  payment_method_name: string;
  sender_name: string | null;
  sender_phone: string | null;
  transaction_ref: string | null;
  slip_url: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  tenants?: Tenant;
  subscription_plans?: SubscriptionPlan;
}
