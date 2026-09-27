"use client";

import { useState } from "react";
import { FounderTenantSummary } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTenantPlanAction, updateTenantStatusAction, extendSubscriptionAction } from "@/actions/founder";
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
import { toast } from "sonner";
import { ExternalLink, CalendarPlus, Power } from "lucide-react";
import Link from "next/link";

interface FounderTenantsTableProps {
  tenants: FounderTenantSummary[];
}

export function FounderTenantsTable({ tenants }: FounderTenantsTableProps) {
  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);

  async function handlePlanChange(tenantId: string, planId: "free" | "starter" | "pro") {
    setLoadingTenantId(tenantId);
    try {
      const res = await updateTenantPlanAction({ tenantId, planId });
      if (!res.success) {
        toast.error(res.error || "Failed to update plan.");
      } else {
        toast.success(`Plan updated to ${planId.toUpperCase()}.`);
      }
    } catch {
      toast.error("Network communication error.");
    } finally {
      setLoadingTenantId(null);
    }
  }

  async function handleToggleStatus(tenantId: string, currentStatus: string) {
    setLoadingTenantId(tenantId);
    const newStatus = currentStatus === "active" ? "suspended" : "active";

    try {
      const res = await updateTenantStatusAction({ tenantId, status: newStatus });
      if (!res.success) {
        toast.error(res.error || "Failed to update status.");
      } else {
        toast.success(`Store status changed to ${newStatus}.`);
      }
    } catch {
      toast.error("Network communication error.");
    } finally {
      setLoadingTenantId(null);
    }
  }

  async function handleExtend(tenantId: string) {
    setLoadingTenantId(tenantId);
    try {
      const res = await extendSubscriptionAction({ tenantId, daysToAdd: 30 });
      if (!res.success) {
        toast.error(res.error || "Failed to extend subscription.");
      } else {
        toast.success("Subscription extended by 30 days.");
      }
    } catch {
      toast.error("Network communication error.");
    } finally {
      setLoadingTenantId(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-slate-200">
            <TableHead className="text-xs font-semibold text-slate-700">Store / Shop Code</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">Owner</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">Plan</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-center">Status</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-center">Usage</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Revenue</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map(({ tenant, owner, totalProducts, totalStaff, totalRevenue }) => {
            const isLoading = loadingTenantId === tenant.id;
            const isSuspended = tenant.subscription_status === "suspended";

            return (
              <TableRow key={tenant.id} className="border-slate-100 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs">
                  <div className="font-semibold text-slate-900">{tenant.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-mono">
                    <Link
                      href={`/${tenant.shop_code}/dashboard`}
                      target="_blank"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>/{tenant.shop_code}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs">
                  <div className="font-medium text-slate-800">{owner?.full_name || "Unassigned"}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatDateTime(tenant.created_at)}
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs">
                  <div className="w-28">
                    <Select
                      defaultValue={tenant.plan_id}
                      disabled={isLoading}
                      onValueChange={(val) => handlePlanChange(tenant.id, val as "free" | "starter" | "pro")}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free ($0)</SelectItem>
                        <SelectItem value="starter">Starter ($15)</SelectItem>
                        <SelectItem value="pro">Pro ($35)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-center text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${
                      isSuspended
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}
                  >
                    {tenant.subscription_status}
                  </Badge>
                  {tenant.subscription_expires_at && (
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Exp: {formatDateTime(tenant.subscription_expires_at).split(",")[0]}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-3 text-center text-xs font-mono text-slate-600 tabular-nums">
                  <div>{totalProducts} items</div>
                  <div className="text-[10px] text-slate-400">{totalStaff} staff</div>
                </TableCell>
                <TableCell className="py-3 text-right text-xs font-mono font-bold text-slate-900 tabular-nums">
                  {formatCurrency(totalRevenue)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          className="h-7 px-2 text-[11px] text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          <CalendarPlus className="w-3 h-3 mr-1 text-slate-500" />
                          +30 Days
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm font-semibold text-slate-900">
                            Extend Store Subscription?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-slate-500">
                            Add 30 billing days to {tenant.name}&apos;s subscription access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                          <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleExtend(tenant.id)}
                            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Confirm +30 Days
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className={`h-7 px-2 text-[11px] cursor-pointer ${
                            isSuspended
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }`}
                        >
                          <Power className="w-3 h-3 mr-1" />
                          {isSuspended ? "Activate" : "Suspend"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm font-semibold text-slate-900">
                            {isSuspended ? "Reactivate Store Access?" : "Suspend Store Access?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-slate-500">
                            {isSuspended
                              ? `Restore active status for ${tenant.name}. Staff will be able to log in and process sales immediately.`
                              : `Temporarily suspend ${tenant.name}. Store staff will be blocked from logging in and processing sales.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                          <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleToggleStatus(tenant.id, tenant.subscription_status)}
                            className={`text-xs h-8 text-white ${
                              isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {isSuspended ? "Reactivate Store" : "Suspend Store"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
