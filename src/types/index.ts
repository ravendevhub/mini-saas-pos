import { Product, Role, Profile, Sale, SaleItem, TenantWithPlan } from "./database";

export * from "./database";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleWithDetails extends Sale {
  cashier: Profile;
  sale_items: Array<SaleItem & { product: Product }>;
}

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  totalProductsCount: number;
  lowStockCount: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface FounderTenantSummary {
  tenant: TenantWithPlan;
  owner: Profile | null;
  totalProducts: number;
  totalStaff: number;
  totalSalesCount: number;
  totalRevenue: number;
}
