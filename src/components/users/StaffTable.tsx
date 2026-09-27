"use client";

import { useState } from "react";
import { ProfileWithRole } from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddStaffDialog } from "./AddStaffDialog";
import { UserPlus, Shield } from "lucide-react";

interface StaffTableProps {
  staffList: ProfileWithRole[];
}

export function StaffTable({ staffList }: StaffTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {staffList.length} registered {staffList.length === 1 ? "member" : "members"}
        </span>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add Staff
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200">
              <TableHead className="text-xs font-semibold text-slate-700">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Role</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Permissions</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.map((member) => {
              const isOwner = member.role_id === "owner";
              const isManager = member.role_id === "manager";

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
                      {isOwner && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          Full Access
                        </span>
                      )}
                      {member.roles?.can_create_sales && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          POS Checkout
                        </span>
                      )}
                      {member.roles?.can_manage_products && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          Products
                        </span>
                      )}
                      {member.roles?.can_view_reports && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          Reports
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-500 text-right">
                    {formatDateTime(member.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AddStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
