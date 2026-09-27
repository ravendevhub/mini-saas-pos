export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "qr_transfer", label: "QR / Transfer" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const APP_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  CASHIER: "cashier",
} as const;

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  requiredPermission?: "can_manage_products" | "can_create_sales" | "can_view_reports" | "can_manage_users";
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Point of Sale",
    href: "/pos",
    iconName: "ShoppingCart",
    requiredPermission: "can_create_sales",
  },
  {
    title: "Products",
    href: "/products",
    iconName: "Package",
    requiredPermission: "can_manage_products",
  },
  {
    title: "Sales History",
    href: "/sales",
    iconName: "Receipt",
    requiredPermission: "can_view_reports",
  },
  {
    title: "Reports",
    href: "/reports",
    iconName: "BarChart3",
    requiredPermission: "can_view_reports",
  },
  {
    title: "Staff",
    href: "/users",
    iconName: "Users",
    requiredPermission: "can_manage_users",
  },
];
