import { Role } from "@/types";

export interface ResolvedPermissions {
  products: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  sales: {
    create: boolean;
    view: boolean;
    delete: boolean;
  };
  reports: {
    view: boolean;
  };
  users: {
    view: boolean;
    create: boolean;
    delete: boolean;
  };
}

export function resolvePermissions(role: Role, isSuperAdmin: boolean): ResolvedPermissions {
  if (isSuperAdmin || role.id === "owner") {
    return {
      products: { view: true, create: true, edit: true, delete: true },
      sales: { create: true, view: true, delete: true },
      reports: { view: true },
      users: { view: true, create: true, delete: true },
    };
  }

  const canManageProducts = Boolean(role.can_manage_products);
  const canManageUsers = Boolean(role.can_manage_users);
  const canCreateSales = Boolean(role.can_create_sales);
  const canViewReports = Boolean(role.can_view_reports);

  return {
    products: {
      view: canManageProducts || canCreateSales,
      create: canManageProducts,
      edit: canManageProducts,
      delete: canManageProducts,
    },
    sales: {
      create: canCreateSales,
      view: canViewReports,
      delete: false,
    },
    reports: {
      view: canViewReports,
    },
    users: {
      view: canManageUsers,
      create: canManageUsers,
      delete: canManageUsers,
    },
  };
}

export type RawRolePermissions = {
  can_manage_users?: boolean;
  can_manage_products?: boolean;
  can_create_sales?: boolean;
  can_view_reports?: boolean;
  can_view_products?: boolean;
  can_create_products?: boolean;
  can_edit_products?: boolean;
  can_delete_products?: boolean;
  can_view_sales?: boolean;
  can_delete_sales?: boolean;
  can_view_users?: boolean;
  can_create_users?: boolean;
  can_delete_users?: boolean;
};
