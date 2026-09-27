"use client";

import { useState, useEffect } from "react";
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
  Sliders,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { Role, TenantWithPlan, Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const accessibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    if (role.id === "owner" || profile.is_super_admin) return true;
    return Boolean(role[item.requiredPermission]);
  });

  const planName = tenant.subscription_plans?.name || tenant.plan_id.toUpperCase();
  const isSuperAdminViewing = profile.is_super_admin && profile.tenant_id !== tenant.id;

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-slate-200 bg-white shrink-0 h-screen sticky top-0 transition-[width] duration-200 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {!isCollapsed ? (
        <div className="p-3.5 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-semibold text-slate-900 truncate">{tenant.name}</h2>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-mono truncate">@{shopCode}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                    {planName}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md shrink-0 cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
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
      ) : (
        <div className="p-2.5 border-b border-slate-200 flex flex-col items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0"
            title={`${tenant.name} (@${shopCode})`}
          >
            <Store className="w-4 h-4" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Expand sidebar</span>
          </Button>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto space-y-1 ${isCollapsed ? "p-2" : "p-3"}`}>
        {accessibleNavItems.map((item) => {
          const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP] || Package;
          const targetHref = `/${shopCode}${item.href}`;
          const isActive = pathname === targetHref || pathname.startsWith(targetHref + "/");

          if (isCollapsed) {
            return (
              <Link
                key={item.href}
                href={targetHref}
                title={item.title}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                <span className="sr-only">{item.title}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{item.title}</span>
            </Link>
          );
        })}

        {isCollapsed ? (
          <Link
            href={`/${shopCode}/settings`}
            title="Plan & Settings"
            className={`flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-colors ${
              pathname.startsWith(`/${shopCode}/settings`)
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Sliders className={`w-4 h-4 shrink-0 ${pathname.startsWith(`/${shopCode}/settings`) ? "text-indigo-600" : "text-slate-500"}`} />
            <span className="sr-only">Plan & Settings</span>
          </Link>
        ) : (
          <Link
            href={`/${shopCode}/settings`}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname.startsWith(`/${shopCode}/settings`)
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Plan & Settings</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}
