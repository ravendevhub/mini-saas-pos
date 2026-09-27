"use client";

import { useState } from "react";
import { SubscriptionPlan, FounderTenantSummary } from "@/types";
import { updateSubscriptionPlanAction } from "@/actions/founder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { Layers, Edit2, CheckCircle2, Package, Users, ShieldCheck, Loader2 } from "lucide-react";

interface FounderPlansCardProps {
  plans: SubscriptionPlan[];
  tenants: FounderTenantSummary[];
}

export function FounderPlansCard({ plans, tenants }: FounderPlansCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [maxProducts, setMaxProducts] = useState("");
  const [maxStaff, setMaxStaff] = useState("");
  const [canViewReports, setCanViewReports] = useState(true);
  const [isPending, setIsPending] = useState(false);

  function handleOpenEdit(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setName(plan.name);
    setPrice(plan.price_per_month.toString());
    setMaxProducts(plan.max_products.toString());
    setMaxStaff(plan.max_staff.toString());
    setCanViewReports(plan.can_view_reports);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsPending(true);

    try {
      const res = await updateSubscriptionPlanAction({
        planId: selectedPlan.id,
        name: name.trim(),
        price_per_month: parseFloat(price) || 0,
        max_products: parseInt(maxProducts, 10) || 1,
        max_staff: parseInt(maxStaff, 10) || 1,
        can_view_reports: canViewReports,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update subscription plan.");
      } else {
        toast.success(`Plan "${name}" updated successfully.`);
        setSelectedPlan(null);
      }
    } catch {
      toast.error("Network error while updating plan.");
    } finally {
      setIsPending(false);
    }
  }

  function getStoreCountForPlan(planId: string) {
    return tenants.filter((t) => t.tenant.plan_id === planId).length;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Subscription Plan Management</h3>
          <p className="text-xs text-slate-500">Configure feature ceilings, inventory quotas, and pricing tiers for all stores.</p>
        </div>
        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-mono">
          {plans.length} Active Tiers
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const storeCount = getStoreCountForPlan(plan.id);
          const isFree = plan.id === "free";
          const isPro = plan.id === "pro";

          return (
            <Card
              key={plan.id}
              className={`border bg-white shadow-sm flex flex-col justify-between transition-all ${
                isPro ? "border-indigo-300 ring-1 ring-indigo-100" : "border-slate-200"
              }`}
            >
              <CardHeader className="p-4 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isFree
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : isPro
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {plan.id}
                  </Badge>
                  <span className="text-[11px] font-medium text-slate-500">
                    {storeCount} {storeCount === 1 ? "store" : "stores"}
                  </span>
                </div>
                <CardTitle className="text-base font-semibold text-slate-900 pt-1">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatCurrency(plan.price_per_month)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-4">
                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      Catalog Capacity
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {plan.max_products.toLocaleString()} items
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Staff Accounts
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {plan.max_staff} {plan.max_staff === 1 ? "seat" : "seats"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Financial Reports
                    </span>
                    <span className="font-medium text-green-700 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Included
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(plan)}
                  className="w-full h-8 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  <Edit2 className="w-3 h-3 mr-1.5" />
                  Edit Tier Specs
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 p-4 sm:p-6 text-slate-900">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Edit Subscription Tier ({selectedPlan?.id.toUpperCase()})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify the pricing, inventory limits, and user capacity for this tier.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="plan-name">
                Plan Display Name *
              </label>
              <Input
                id="plan-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="plan-price">
                Monthly Price (USD $) *
              </label>
              <Input
                id="plan-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700" htmlFor="plan-products">
                  Max Products *
                </label>
                <Input
                  id="plan-products"
                  type="number"
                  min="1"
                  required
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700" htmlFor="plan-staff">
                  Max Staff Members *
                </label>
                <Input
                  id="plan-staff"
                  type="number"
                  min="1"
                  required
                  value={maxStaff}
                  onChange={(e) => setMaxStaff(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setSelectedPlan(null)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
