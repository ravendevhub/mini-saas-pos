"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { createStaffAction } from "@/actions/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { recordActionLog } from "@/lib/action-logger";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopCode?: string;
}

export function AddStaffDialog({ open, onOpenChange, shopCode }: AddStaffDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<"cashier" | "manager">("cashier");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const res = await createStaffAction({
        fullName,
        email,
        password,
        role_id: roleId,
        shopCode,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create staff.");
        recordActionLog({
          action: "Add Staff",
          status: "error",
          details: res.error || `Failed to create staff account for ${fullName}.`,
        });
      } else {
        toast.success("Staff member added successfully.");
        recordActionLog({
          action: "Add Staff",
          status: "success",
          details: `Staff member ${fullName} (${roleId}) registered successfully.`,
        });
        setFullName("");
        setEmail("");
        setPassword("");
        setRoleId("cashier");
        onOpenChange(false);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      recordActionLog({
        action: "Add Staff",
        status: "error",
        details: `Network error while registering ${fullName}.`,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6 bg-white border-slate-200">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Add Staff Member
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Create cashier or manager accounts for your store staff.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <ErrorBanner message={errorMessage} />

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700" htmlFor="staff-name">
              Full Name *
            </label>
            <Input
              id="staff-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Smith"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700" htmlFor="staff-email">
              Login Email *
            </label>
            <Input
              id="staff-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jordan@store.com"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700" htmlFor="staff-pwd">
              Initial Password *
            </label>
            <Input
              id="staff-pwd"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRoleId("cashier")}
                className={`p-2.5 rounded-md border text-left transition-colors ${
                  roleId === "cashier"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <p className="text-xs font-semibold">Cashier</p>
                <p className="text-[10px] text-slate-500">POS checkout & view products</p>
              </button>
              <button
                type="button"
                onClick={() => setRoleId("manager")}
                className={`p-2.5 rounded-md border text-left transition-colors ${
                  roleId === "manager"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <p className="text-xs font-semibold">Manager</p>
                <p className="text-[10px] text-slate-500">Full product CRUD, sales & reports</p>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Adding Staff...
                </>
              ) : (
                "Add Staff"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
