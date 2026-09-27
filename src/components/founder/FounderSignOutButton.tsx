"use client";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
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
import { LogOut } from "lucide-react";

export function FounderSignOutButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 h-8 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 mr-1" />
          Sign Out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-semibold text-slate-900">
            Exit Founder Console?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-500">
            Are you sure you want to end your Super Admin session? You will be returned to the founder login portal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
          <form action={logoutAction}>
            <AlertDialogAction
              type="submit"
              className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
