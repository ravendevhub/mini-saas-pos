export interface SubscriptionPlan {
  id: "free" | "starter" | "pro" | string;
  name: string;
  price_per_month: number;
  max_products: number;
  max_staff: number;
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

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
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
