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
  if (isSuperAdmin) {
    return {
      products: { view: true, create: true, edit: true, delete: true },
      sales: { create: true, view: true, delete: true },
      reports: { view: true },
      users: { view: true, create: true, delete: true },
    };
  }

  return {
    products: {
      view: role.can_view_products,
      create: role.can_create_products,
      edit: role.can_edit_products,
      delete: role.can_delete_products,
    },
    sales: {
      create: role.can_create_sales,
      view: role.can_view_sales,
      delete: role.can_delete_sales,
    },
    reports: {
      view: role.can_view_reports,
    },
    users: {
      view: role.can_view_users,
      create: role.can_create_users,
      delete: role.can_delete_users,
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
