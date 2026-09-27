"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Store, 
  ShoppingCart, 
  ChevronRight, 
  ShieldCheck, 
  ArrowLeft,
  Sliders,
  LogOut,
  User as UserIcon,
  Menu
} from "lucide-react";
import { TenantWithPlan, Profile, Role } from "@/types";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  BarChart3, 
  Users 
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Users,
};

const SECTION_TITLES: Record<string, string> = {
  dashboard: "Overview Dashboard",
  pos: "Point of Sale (POS)",
  products: "Product Catalog",
  sales: "Sales History & Receipts",
  reports: "Analytics & Reports",
  users: "Staff Management",
  settings: "Plan & Settings",
};

interface HeaderProps {
  tenant: TenantWithPlan;
  profile: Profile;
  role: Role;
  shopCode: string;
  storeOwnerName: string;
}

export function Header({
  tenant,
  profile,
  role,
  shopCode,
  storeOwnerName,
}: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathParts = pathname.split("/").filter(Boolean);
  const currentSection = pathParts[1] || "dashboard";
  const sectionTitle = SECTION_TITLES[currentSection] || "Overview";

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const accessibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    if (role.id === "owner" || profile.is_super_admin) return true;
    return Boolean(role[item.requiredPermission]);
  });

  const isSuperAdminViewing = profile.is_super_admin && profile.tenant_id !== tenant.id;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0 text-slate-700"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b border-slate-200 text-left">
              <SheetTitle className="text-sm font-semibold text-slate-900">{tenant.name}</SheetTitle>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-mono">@{shopCode}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize text-slate-600 border-slate-200">
                  {tenant.subscription_plans?.name || tenant.plan_id.toUpperCase()}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Owner: <span className="font-medium text-slate-700">{storeOwnerName}</span>
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
                    onClick={() => setMobileOpen(false)}
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
                onClick={() => setMobileOpen(false)}
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
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href={`/${shopCode}/dashboard`}
            className="font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
          >
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tenant.name}</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-semibold text-slate-900">{sectionTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isSuperAdminViewing && (
          <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-md text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Super Admin View</span>
            <span className="text-amber-400">|</span>
            <span className="text-amber-700">Owner: {storeOwnerName}</span>
            <Link href="/founder">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Exit to Founder
              </Button>
            </Link>
          </div>
        )}

        {currentSection !== "pos" && (
          <Link href={`/${shopCode}/pos`}>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Point of Sale</span>
            </Button>
          </Link>
        )}

        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 rounded-full p-0 cursor-pointer"
              >
                <Avatar className="h-8 w-8 border border-slate-200">
                  <AvatarFallback className="bg-slate-100 text-slate-800 text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-slate-900">{profile.full_name}</p>
                  <p className="text-[11px] leading-none text-slate-500 capitalize">
                    {profile.is_super_admin ? "Super Admin" : role.name}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer text-xs">
                  <Link href={`/${shopCode}/dashboard`}>
                    <Store className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <span>{tenant.name}</span>
                  </Link>
                </DropdownMenuItem>
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
                      <span>Founder Console</span>
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
    </header>
  );
}
