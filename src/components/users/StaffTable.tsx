"use client";

import { useState } from "react";
import { ProfileWithRole } from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddStaffDialog } from "./AddStaffDialog";
import { deleteStaffAction } from "@/actions/users";
import { recordActionLog } from "@/lib/action-logger";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

interface StaffTableProps {
  staffList: ProfileWithRole[];
  shopCode?: string;
  canCreate?: boolean;
  canDelete?: boolean;
}

export function StaffTable({
  staffList,
  shopCode,
  canCreate = true,
  canDelete = true,
}: StaffTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfileWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await deleteStaffAction(deleteTarget.id, shopCode);
      if (!res.success) {
        toast.error(res.error || "Failed to remove staff member.");
        recordActionLog({
          action: "Delete Staff",
          status: "error",
          details: res.error || `Failed to remove ${deleteTarget.full_name}.`,
        });
      } else {
        toast.success(`Staff member "${deleteTarget.full_name}" removed.`);
        recordActionLog({
          action: "Delete Staff",
          status: "success",
          details: `Staff member "${deleteTarget.full_name}" successfully removed.`,
        });
        setDeleteTarget(null);
      }
    } catch {
      toast.error("Network error while removing staff.");
      recordActionLog({
        action: "Delete Staff",
        status: "error",
        details: `Network error while removing ${deleteTarget.full_name}.`,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {staffList.length} registered {staffList.length === 1 ? "member" : "members"}
        </span>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Staff
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200">
              <TableHead className="text-xs font-semibold text-slate-700">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Role</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Permissions</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 text-right">Joined</TableHead>
              {canDelete && (
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.map((member) => {
              const isOwner = member.role_id === "owner";
              const isManager = member.role_id === "manager";
              const r = member.roles;

              return (
                <TableRow key={member.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="py-2.5 text-xs font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                        {member.full_name.charAt(0)}
                      </div>
                      <span>{member.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        isOwner
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                          : isManager
                          ? "bg-blue-50 text-blue-700 border-blue-200 font-medium"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {member.roles?.name || member.role_id}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isOwner ? (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-medium">
                          Full Access
                        </span>
                      ) : (
                        <>
                          {r?.can_create_sales && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                              POS
                            </span>
                          )}
                          {r?.can_manage_products && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                              Products
                            </span>
                          )}
                          {r?.can_view_reports && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                              Reports
                            </span>
                          )}
                          {r?.can_manage_users && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono">
                              Staff
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-500 text-right">
                    {formatDateTime(member.created_at)}
                  </TableCell>
                  {canDelete && (
                    <TableCell className="py-2.5 text-right">
                      {!isOwner ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(member)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Owner</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AddStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} shopCode={shopCode} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm p-4 sm:p-6">
          <AlertDialogHeader className="text-left space-y-1">
            <AlertDialogTitle className="text-base font-semibold text-slate-900">
              Remove Staff Member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600">
              Are you sure you want to remove &quot;{deleteTarget?.full_name}&quot;? If this staff member has past sales records, they cannot be deleted to preserve receipt history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
            <AlertDialogCancel disabled={isDeleting} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            >
              {isDeleting ? "Removing..." : "Confirm Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
