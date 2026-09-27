"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  Store, 
  LayoutDashboard,
  ShoppingCart, 
  Package, 
  Receipt, 
  BarChart3, 
  Users, 
  LogOut,
  Sliders
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/lib/constants";
import { Role, TenantWithPlan, Profile } from "@/types";
import { logoutAction } from "@/actions/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ICON_MAP = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Users,
};

interface MobileNavProps {
  tenant: TenantWithPlan;
  profile: Profile;
  role: Role;
  shopCode: string;
}

export function MobileNav({ tenant, profile, role, shopCode }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const accessibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    if (role.id === "owner" || profile.is_super_admin) return true;
    return Boolean(role[item.requiredPermission]);
  });

  const planName = tenant.subscription_plans?.name || tenant.plan_id.toUpperCase();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
          <Store className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-900 truncate block">
            {tenant.name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate block">
            @{shopCode} • {planName}
          </span>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-700">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-white">
          <SheetHeader className="p-4 border-b border-slate-200 text-left">
            <SheetTitle className="text-sm font-semibold text-slate-900">{tenant.name}</SheetTitle>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-600 truncate">{profile.full_name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize text-slate-600 border-slate-200">
                {role.name}
              </Badge>
            </div>
          </SheetHeader>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {accessibleNavItems.map((item) => {
              const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP] || Package;
              const targetHref = `/${shopCode}${item.href}`;
              const isActive = pathname === targetHref || pathname.startsWith(targetHref + "/");

              return (
                <Link
                  key={item.href}
                  href={targetHref}
                  onClick={() => setOpen(false)}
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
              onClick={() => setOpen(false)}
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

          <div className="p-4 border-t border-slate-200">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2 text-slate-400" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm font-semibold text-slate-900">
                    Confirm Sign Out
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-slate-500">
                    Are you sure you want to end your session? You will need to sign in again to access your store.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
                  <form action={logoutAction}>
                    <AlertDialogAction
                      type="submit"
                      className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
