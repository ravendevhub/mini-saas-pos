"use client";

import { useState } from "react";
import { SubscriptionPlan, FounderPaymentMethod, SubscriptionPaymentRequest } from "@/types";
import { submitSubscriptionRequestAction } from "@/actions/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { Copy, Check, Upload, Loader2, QrCode, CheckCircle2, Package, Users, Receipt, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface PlanUpgradeDialogProps {
  currentPlanId: string;
  plans: SubscriptionPlan[];
  paymentMethods: FounderPaymentMethod[];
  pendingRequest: SubscriptionPaymentRequest | null;
}

export function PlanUpgradeDialog({
  currentPlanId,
  plans,
  paymentMethods,
  pendingRequest,
}: PlanUpgradeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentMethods.length > 0 ? paymentMethods[0].id : ""
  );
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [viewSlipModal, setViewSlipModal] = useState<string | null>(null);

  const activeMethod =
    paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];

  function handleOpenUpgrade(plan: SubscriptionPlan) {
    if (pendingRequest && pendingRequest.status === "pending") {
      toast.error(
        "You already have a plan request pending verification. Please wait for the Founder to process it."
      );
      return;
    }
    setSelectedPlan(plan);
    setSenderName("");
    setSenderPhone("");
    setTransactionRef("");
    setSlipUrl("");
    if (paymentMethods.length > 0) {
      setSelectedMethodId(paymentMethods[0].id);
    }
  }

  function handleCopyNumber(num: string) {
    navigator.clipboard.writeText(num);
    setIsCopied(true);
    toast.success("Account number copied to clipboard.");
    setTimeout(() => setIsCopied(false), 2000);
  }

  function handleSlipUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSlipUrl(dataUrl);
        toast.success("Payment slip screenshot uploaded.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!activeMethod) {
      toast.error("No active founder payment accounts available. Please contact founder admin.");
      return;
    }

    if (!senderName.trim() || !senderPhone.trim()) {
      toast.error("Please enter sender name and phone number.");
      return;
    }

    if (!slipUrl) {
      toast.error("Please upload your payment transfer receipt/screenshot.");
      return;
    }

    setIsPending(true);
    try {
      const res = await submitSubscriptionRequestAction({
        requested_plan_id: selectedPlan.id,
        payment_method_id: activeMethod.id,
        payment_method_name: activeMethod.provider_name,
        sender_name: senderName.trim(),
        sender_phone: senderPhone.trim(),
        transaction_ref: transactionRef.trim() || null,
        slip_url: slipUrl,
        amount: selectedPlan.price_per_month,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit upgrade request.");
        return;
      }

      toast.success(
        "Payment slip submitted successfully! Founder admin will review and activate your plan."
      );
      setSelectedPlan(null);
    } catch {
      toast.error("An unexpected error occurred while submitting request.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {pendingRequest && pendingRequest.status === "pending" && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-amber-900">
                Pending Plan Change Verification
              </h4>
              <p className="text-[11px] text-amber-800">
                You have requested an upgrade to{" "}
                <span className="font-semibold uppercase">{pendingRequest.requested_plan_id}</span> ({formatCurrency(pendingRequest.amount)}/mo). Founder is verifying your payment slip.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewSlipModal(pendingRequest.slip_url)}
            className="text-xs h-7 border-amber-300 text-amber-900 bg-white hover:bg-amber-100/50"
          >
            View Submitted Slip
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isRequested = pendingRequest?.requested_plan_id === plan.id && pendingRequest?.status === "pending";

          return (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border bg-white flex flex-col justify-between ${
                isCurrent
                  ? "border-indigo-600 shadow-sm ring-1 ring-indigo-600"
                  : isRequested
                  ? "border-amber-400 bg-amber-50/20"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                  {isCurrent && (
                    <Badge className="bg-indigo-600 text-white text-[10px]">Current Plan</Badge>
                  )}
                  {isRequested && (
                    <Badge className="bg-amber-500 text-white text-[10px]">Pending Approval</Badge>
                  )}
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mb-3 tabular-nums">
                  {formatCurrency(plan.price_per_month)}
                  <span className="text-xs font-normal text-slate-500"> / month</span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Up to {plan.max_products.toLocaleString()} catalog products</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Up to {plan.max_staff} staff cashier seats</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Up to {(plan.max_orders_per_month || 500).toLocaleString()} monthly vouchers (vr)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Realtime aggregated sales reports</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isCurrent ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full text-xs h-8 border-slate-200 text-slate-500 bg-slate-50"
                  >
                    Active Plan
                  </Button>
                ) : isRequested ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full text-xs h-8 border-amber-300 text-amber-700 bg-amber-50"
                  >
                    Awaiting Approval
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleOpenUpgrade(plan)}
                    className="w-full text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Switch to {plan.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-xl bg-white border-slate-200 p-4 sm:p-6 text-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Upgrade to {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Transfer the subscription fee using Founder payment accounts below and upload your transfer receipt.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">Selected Tier</span>
                  <div className="text-sm font-semibold text-slate-900">{selectedPlan.name}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">Subscription Fee</span>
                  <div className="text-base font-bold font-mono text-indigo-600 tabular-nums">
                    {formatCurrency(selectedPlan.price_per_month)}
                    <span className="text-xs font-normal text-slate-500"> / mo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 block">
                  1. Select Payment Method & Transfer
                </label>

                {paymentMethods.length === 0 ? (
                  <div className="p-3 rounded border border-amber-200 bg-amber-50 text-xs text-amber-800">
                    No active founder payment accounts available. Please contact administrator directly.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {paymentMethods.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`text-xs px-3 py-1.5 rounded border font-medium transition-all ${
                            selectedMethodId === m.id
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {m.provider_name}
                        </button>
                      ))}
                    </div>

                    {activeMethod && (
                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {activeMethod.qr_code_url ? (
                          <div className="w-28 h-28 rounded-lg border border-indigo-200 overflow-hidden bg-white p-1 shadow-sm flex-shrink-0">
                            <img
                              src={activeMethod.qr_code_url}
                              alt={`${activeMethod.provider_name} QR`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-lg border border-dashed border-indigo-200 bg-white flex flex-col items-center justify-center text-indigo-300 flex-shrink-0">
                            <QrCode className="w-8 h-8" />
                            <span className="text-[10px] mt-1 text-slate-400">Direct Transfer</span>
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
                          <div>
                            <span className="text-[11px] text-slate-500">Account Holder Name</span>
                            <div className="text-xs font-semibold text-slate-900">{activeMethod.account_name}</div>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500">Account / Phone Number</span>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                              <span className="text-sm font-mono font-bold text-indigo-700 tabular-nums">
                                {activeMethod.account_number}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyNumber(activeMethod.account_number)}
                                className="h-6 px-2 text-[10px] border-indigo-200 text-indigo-700 bg-white"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-green-600 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                Copy
                              </Button>
                            </div>
                          </div>

                          {activeMethod.instructions && (
                            <p className="text-[11px] text-slate-600 italic pt-1">
                              Notice: &quot;{activeMethod.instructions}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-1 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-900 block">
                  2. Enter Transfer Details & Upload Slip
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700" htmlFor="sender-name">
                      Sender Name / Account Name *
                    </label>
                    <Input
                      id="sender-name"
                      placeholder="e.g. Daw Khin Khin"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700" htmlFor="sender-phone">
                      Sender Phone Number *
                    </label>
                    <Input
                      id="sender-phone"
                      placeholder="e.g. 09123456789"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700" htmlFor="transaction-ref">
                    Transaction ID / Reference (Optional)
                  </label>
                  <Input
                    id="transaction-ref"
                    placeholder="e.g. 20260927000123"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                    <span>Payment Transfer Slip Screenshot *</span>
                    {slipUrl && (
                      <button
                        type="button"
                        onClick={() => setSlipUrl("")}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Re-upload Slip
                      </button>
                    )}
                  </label>

                  {slipUrl ? (
                    <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 max-h-48 flex items-center justify-center p-2">
                      <img src={slipUrl} alt="Transfer Slip Preview" className="max-h-44 object-contain mx-auto rounded" />
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-medium text-slate-700">Click to upload payment screenshot</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or WEBP (Max 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleSlipUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                  disabled={isPending || !slipUrl}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Upgrade Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewSlipModal)} onOpenChange={(open) => !open && setViewSlipModal(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 p-4 text-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-sm font-semibold text-slate-900">Your Submitted Payment Slip</DialogTitle>
          </DialogHeader>
          {viewSlipModal && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200 inline-block mx-auto mt-2 max-h-[65vh] overflow-auto">
              <img src={viewSlipModal} alt="Submitted Slip" className="max-w-full max-h-[55vh] object-contain mx-auto" />
            </div>
          )}
          <DialogFooter className="sm:justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewSlipModal(null)}
              className="text-xs h-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
