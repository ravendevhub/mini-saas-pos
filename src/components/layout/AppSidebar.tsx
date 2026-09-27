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
  LogOut, 
  Store,
  Sliders,
  ShieldCheck,
  ChevronUp
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { Role, TenantWithPlan, Profile } from "@/types";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

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

      <div className="p-3 border-t border-slate-200 space-y-2">
        {isSuperAdminViewing && (
          <Link href="/founder">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 border-indigo-200 cursor-pointer justify-start"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Founder Console
            </Button>
          </Link>
        )}

        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-2 py-1.5 h-auto hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0 text-left">
                  <Avatar className="h-7 w-7 border border-slate-200">
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{profile.full_name}</p>
                    <p className="text-[10px] text-slate-500 capitalize leading-none pt-0.5">
                      {profile.is_super_admin ? "Super Admin" : role.name}
                    </p>
                  </div>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900">{profile.full_name}</p>
                  <p className="text-[11px] text-slate-500">
                    {profile.is_super_admin ? "Platform Super Admin" : `${tenant.name} (${role.name})`}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer text-xs">
                  <Link href={`/${shopCode}/settings`}>
                    <Sliders className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <span>Plan & Settings</span>
                  </Link>
                </DropdownMenuItem>
                {profile.is_super_admin && (
                  <DropdownMenuItem asChild className="cursor-pointer text-xs text-indigo-600 font-medium">
                    <Link href="/founder">
                      <ShieldCheck className="mr-2 h-3.5 w-3.5 text-indigo-600" />
                      <span>Platform Founder Console</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-slate-100" />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-3.5 w-3.5 text-red-500" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm font-semibold text-slate-900">
                Confirm Sign Out
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500">
                Are you sure you want to end your current session? You will need to sign in again to access your store.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
              <form action={logoutAction}>
                <AlertDialogAction
                  type="submit"
                  className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  Sign Out
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}
