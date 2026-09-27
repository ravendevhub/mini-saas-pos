"use client";

import { useState } from "react";
import { FounderPaymentMethod } from "@/types";
import { saveFounderPaymentMethodAction, deleteFounderPaymentMethodAction } from "@/actions/founder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { QrCode, Plus, Edit2, Trash2, Copy, Check, Upload, Loader2, CreditCard, Image as ImageIcon } from "lucide-react";

interface FounderPaymentMethodsCardProps {
  initialMethods: FounderPaymentMethod[];
}

export function FounderPaymentMethodsCard({ initialMethods }: FounderPaymentMethodsCardProps) {
  const [methods, setMethods] = useState<FounderPaymentMethod[]>(initialMethods);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<FounderPaymentMethod | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [providerName, setProviderName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);

  function handleOpenCreate() {
    setEditingMethod(null);
    setProviderName("");
    setAccountName("");
    setAccountNumber("");
    setQrCodeUrl("");
    setInstructions("Please include your shop code in the transfer note.");
    setIsActive(true);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(method: FounderPaymentMethod) {
    setEditingMethod(method);
    setProviderName(method.provider_name);
    setAccountName(method.account_name);
    setAccountNumber(method.account_number);
    setQrCodeUrl(method.qr_code_url || "");
    setInstructions(method.instructions || "");
    setIsActive(method.is_active);
    setIsDialogOpen(true);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image file size must be less than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 600;
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
        setQrCodeUrl(dataUrl);
        toast.success("QR code image loaded successfully.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!providerName.trim() || !accountName.trim() || !accountNumber.trim()) {
      toast.error("Please fill in provider name, account name, and number.");
      return;
    }

    setIsPending(true);
    try {
      const res = await saveFounderPaymentMethodAction({
        id: editingMethod?.id,
        provider_name: providerName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        qr_code_url: qrCodeUrl.trim() || null,
        instructions: instructions.trim() || null,
        is_active: isActive,
        display_order: editingMethod?.display_order || methods.length + 1,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save payment method.");
        return;
      }

      if (editingMethod && res.data) {
        setMethods((prev) => prev.map((m) => (m.id === editingMethod.id ? res.data! : m)));
        toast.success("Payment method updated successfully.");
      } else if (res.data) {
        setMethods((prev) => [...prev, res.data!]);
        toast.success("New payment method created successfully.");
      }

      setIsDialogOpen(false);
    } catch {
      toast.error("An unexpected error occurred while saving payment method.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    setIsPending(true);
    try {
      const res = await deleteFounderPaymentMethodAction(deletingId);
      if (!res.success) {
        toast.error(res.error || "Failed to delete payment method.");
        return;
      }

      setMethods((prev) => prev.filter((m) => m.id !== deletingId));
      toast.success("Payment method removed successfully.");
      setDeletingId(null);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  function handleCopyNumber(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Account number copied to clipboard.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Payment Accounts & Scan QR Management</h3>
          <p className="text-xs text-slate-500">
            Configure receiving accounts (KBZPay, WavePay, Bank) and QR codes shown to customers when upgrading plans.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Payment Account
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">No payment accounts configured yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Add your KBZPay, WavePay, or bank accounts with QR codes so merchants can transfer funds when upgrading.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenCreate}
              className="text-xs h-8 border-slate-200"
            >
              Add First Account
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((method) => {
            const isCopied = copiedId === method.id;
            return (
              <Card
                key={method.id}
                className={`border bg-white shadow-sm flex flex-col justify-between ${
                  method.is_active ? "border-slate-200" : "border-slate-200 bg-slate-50/60 opacity-75"
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{method.provider_name}</span>
                        {method.is_active ? (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-[10px] px-1.5 py-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{method.account_name}</p>
                    </div>

                    {method.qr_code_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewQrUrl(method.qr_code_url)}
                        className="group relative w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-indigo-400 transition-colors"
                        title="Click to view full QR"
                      >
                        <img
                          src={method.qr_code_url}
                          alt={`${method.provider_name} QR`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <QrCode className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                        <QrCode className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                      {method.account_number}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyNumber(method.id, method.account_number)}
                      className="h-6 px-1.5 text-slate-500 hover:text-slate-900"
                      title="Copy account number"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>

                  {method.instructions && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2">
                      &quot;{method.instructions}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(method)}
                      className="h-7 text-xs border-slate-200 text-slate-700"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingId(method.id)}
                      className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 p-4 sm:p-6 text-slate-900">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {editingMethod ? "Edit Payment Account" : "Add Payment Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide account credentials and QR code shown to customers during plan checkout.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700" htmlFor="provider-name">
                  Provider Name *
                </label>
                <Input
                  id="provider-name"
                  placeholder="e.g. KBZPay, WavePay, AYA"
                  required
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700" htmlFor="account-name">
                  Account Name *
                </label>
                <Input
                  id="account-name"
                  placeholder="e.g. U Raven"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="account-number">
                Account / Phone Number *
              </label>
              <Input
                id="account-number"
                placeholder="e.g. 09790000001"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>Scan QR Code Image</span>
                {qrCodeUrl && (
                  <button
                    type="button"
                    onClick={() => setQrCodeUrl("")}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Remove QR
                  </button>
                )}
              </label>

              <div className="flex items-center gap-3">
                {qrCodeUrl ? (
                  <div className="w-16 h-16 rounded border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                    <img src={qrCodeUrl} alt="Preview QR" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs rounded shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">Supports PNG, JPG, or WEBP (Max 3MB)</p>
                </div>
              </div>

              <div className="pt-1">
                <Input
                  placeholder="Or paste external QR image URL directly"
                  value={qrCodeUrl.startsWith("data:") ? "" : qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700" htmlFor="instructions">
                Transfer Instructions / Note
              </label>
              <Input
                id="instructions"
                placeholder="e.g. Please put your shop code in the transfer note."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="method-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="method-active" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                Visible to customers during plan checkout
              </label>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setIsDialogOpen(false)}
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
                  "Save Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewQrUrl)} onOpenChange={(open) => !open && setPreviewQrUrl(null)}>
        <DialogContent className="max-w-sm bg-white border-slate-200 p-4 text-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-sm font-semibold text-slate-900">QR Code Preview</DialogTitle>
          </DialogHeader>
          {previewQrUrl && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200 inline-block mx-auto mt-2">
              <img src={previewQrUrl} alt="QR Code Large" className="max-w-[260px] max-h-[260px] object-contain mx-auto" />
            </div>
          )}
          <DialogFooter className="sm:justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewQrUrl(null)}
              className="text-xs h-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-slate-900">
              Delete Payment Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              This account will no longer be displayed to customers when paying for plan upgrades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
