"use client";

import { useState } from "react";
import { SubscriptionPaymentRequest } from "@/types";
import { reviewSubscriptionRequestAction } from "@/actions/founder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Eye, Store, ArrowRight, Loader2, Receipt } from "lucide-react";

interface FounderSubscriptionRequestsCardProps {
  initialRequests: SubscriptionPaymentRequest[];
}

export function FounderSubscriptionRequestsCard({ initialRequests }: FounderSubscriptionRequestsCardProps) {
  const [requests, setRequests] = useState<SubscriptionPaymentRequest[]>(initialRequests);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<SubscriptionPaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, setIsPending] = useState(false);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  async function handleApprove(request: SubscriptionPaymentRequest) {
    setIsPending(true);
    try {
      const res = await reviewSubscriptionRequestAction({
        requestId: request.id,
        action: "approve",
      });

      if (!res.success) {
        toast.error(res.error || "Failed to approve request.");
        return;
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "approved" } : r))
      );
      toast.success(`Plan activated successfully for ${(request.tenants as unknown as { name?: string })?.name || "Merchant"}!`);
    } catch {
      toast.error("An unexpected error occurred while approving request.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectingRequest) return;
    setIsPending(true);
    try {
      const res = await reviewSubscriptionRequestAction({
        requestId: rejectingRequest.id,
        action: "reject",
        adminNotes: rejectReason.trim() || "Payment slip rejected by Founder.",
      });

      if (!res.success) {
        toast.error(res.error || "Failed to reject request.");
        return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectingRequest.id
            ? { ...r, status: "rejected", admin_notes: rejectReason.trim() }
            : r
        )
      );
      toast.success("Subscription request rejected.");
      setRejectingRequest(null);
      setRejectReason("");
    } catch {
      toast.error("An unexpected error occurred while rejecting request.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-slate-900">Subscription & Upgrade Requests</h3>
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-0.5">
              {pendingCount} Pending Verification
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors capitalize ${
                filter === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">No {filter !== "all" ? filter : ""} subscription requests.</p>
            <p className="text-[11px] text-slate-500">
              When customers upgrade their plan and submit a transfer slip, it will appear here for verification.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const tenant = request.tenants as unknown as { name?: string; shop_code?: string; plan_id?: string };
            const currentPlan = tenant?.plan_id || "free";
            const requestedPlan = request.requested_plan_id;

            return (
              <Card key={request.id} className="border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900">
                        {tenant?.name || "Merchant Store"}
                      </span>
                      {tenant?.shop_code && (
                        <span className="text-[11px] text-slate-500 font-mono ml-1.5">
                          /{tenant.shop_code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === "pending" && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-xs gap-1">
                        <Clock className="w-3 h-3" /> Pending Review
                      </Badge>
                    )}
                    {request.status === "approved" && (
                      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Approved & Active
                      </Badge>
                    )}
                    {request.status === "rejected" && (
                      <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 text-xs gap-1">
                        <XCircle className="w-3 h-3" /> Rejected
                      </Badge>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {formatDateTime(request.created_at)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-500 font-medium">Plan Upgrade Request</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-200 text-slate-600 text-xs font-mono uppercase">
                        {currentPlan}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <Badge className="bg-indigo-600 text-white text-xs font-mono uppercase">
                        {requestedPlan}
                      </Badge>
                    </div>
                    <div className="text-xs font-semibold font-mono text-slate-900 tabular-nums">
                      Amount: {formatCurrency(request.amount)}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="text-[11px] text-slate-500 font-medium">Payment Details</div>
                    <p>
                      <span className="text-slate-400">Method:</span> <span className="font-semibold text-slate-900">{request.payment_method_name}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Sender:</span> <span className="font-medium text-slate-800">{request.sender_name || "N/A"} ({request.sender_phone || "N/A"})</span>
                    </p>
                    {request.transaction_ref && (
                      <p>
                        <span className="text-slate-400">Trx Ref:</span> <span className="font-mono text-slate-800">{request.transaction_ref}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSlipUrl(request.slip_url)}
                      className="group relative w-16 h-16 rounded border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center hover:border-indigo-400 transition-colors"
                      title="View payment slip screenshot"
                    >
                      <img
                        src={request.slip_url}
                        alt="Payment Slip"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </button>

                    {request.status === "pending" && (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleApprove(request)}
                          className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs gap-1 flex-1 sm:flex-initial"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve & Activate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            setRejectingRequest(request);
                            setRejectReason("");
                          }}
                          className="h-8 border-red-200 text-red-600 hover:bg-red-50 text-xs flex-1 sm:flex-initial"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>

                {request.admin_notes && (
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">Founder Note:</span> {request.admin_notes}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(selectedSlipUrl)} onOpenChange={(open) => !open && setSelectedSlipUrl(null)}>
        <DialogContent className="max-w-lg bg-white border-slate-200 p-4 text-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-sm font-semibold text-slate-900">Payment Slip Verification</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Inspect the merchant&apos;s bank or mobile wallet transfer receipt.
            </DialogDescription>
          </DialogHeader>
          {selectedSlipUrl && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200 inline-block mx-auto mt-2 max-h-[70vh] overflow-auto">
              <img src={selectedSlipUrl} alt="Full Payment Slip" className="max-w-full max-h-[60vh] object-contain mx-auto" />
            </div>
          )}
          <DialogFooter className="sm:justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedSlipUrl(null)}
              className="text-xs h-8"
            >
              Close Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejectingRequest)} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 p-4 sm:p-6 text-slate-900">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">Reject Subscription Request</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify the reason for rejection (e.g. transfer amount mismatch, invalid slip).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="reject-reason">
                Rejection Note
              </label>
              <Input
                id="reject-reason"
                placeholder="e.g. Transfer slip unverified. Please re-upload with correct amount."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setRejectingRequest(null)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleRejectConfirm}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
