"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  ShoppingCart, 
  Package, 
  Receipt, 
  BarChart3, 
  Users, 
  Store,
  Sliders
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { Role, TenantWithPlan, Profile } from "@/types";
import { Badge } from "@/components/ui/badge";

const ICON_MAP = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Users,
};

interface AppSidebarProps {
  tenant: TenantWithPlan;
  profile: Profile;
  role: Role;
  shopCode: string;
  storeOwnerName?: string;
}

export function AppSidebar({ tenant, profile, role, shopCode, storeOwnerName }: AppSidebarProps) {
  const pathname = usePathname();

  const accessibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    if (role.id === "owner" || profile.is_super_admin) return true;
    return Boolean(role[item.requiredPermission]);
  });

  const planName = tenant.subscription_plans?.name || tenant.plan_id.toUpperCase();
  const isSuperAdminViewing = profile.is_super_admin && profile.tenant_id !== tenant.id;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0 h-screen sticky top-0">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 truncate">{tenant.name}</h2>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-mono truncate">@{shopCode}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                {planName}
              </Badge>
            </div>
          </div>
        </div>

        {isSuperAdminViewing && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 truncate">
              Owner: <span className="font-medium text-slate-700">{storeOwnerName || "Merchant"}</span>
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200">
              Admin View
            </Badge>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {accessibleNavItems.map((item) => {
          const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP] || Package;
          const targetHref = `/${shopCode}${item.href}`;
          const isActive = pathname === targetHref || pathname.startsWith(targetHref + "/");

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{item.title}</span>
            </Link>
          );
        })}

        <Link
          href={`/${shopCode}/settings`}
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            pathname.startsWith(`/${shopCode}/settings`)
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Plan & Settings</span>
        </Link>
      </nav>
    </aside>
  );
}
