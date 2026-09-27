"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      duration={3000}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600 shrink-0" />,
        info: <InfoIcon className="size-4 text-blue-600 shrink-0" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600 shrink-0" />,
        error: <OctagonXIcon className="size-4 text-red-600 shrink-0" />,
        loading: <Loader2Icon className="size-4 text-indigo-600 animate-spin shrink-0" />,
      }}
      style={{
        "--width": "340px",
      } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border group-[.toaster]:border-slate-200 group-[.toaster]:shadow-md group-[.toaster]:rounded-lg group-[.toaster]:p-3.5 group-[.toaster]:text-xs group-[.toaster]:font-medium",
          title: "text-xs font-semibold text-slate-900",
          description: "text-[11px] text-slate-500",
          actionButton: "text-xs bg-indigo-600 text-white font-medium px-2 py-1 rounded",
          cancelButton: "text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded",
          success: "group-[.toaster]:border-emerald-200 group-[.toaster]:bg-white group-[.toaster]:text-slate-900",
          error: "group-[.toaster]:border-red-200 group-[.toaster]:bg-white group-[.toaster]:text-slate-900",
          warning: "group-[.toaster]:border-amber-200 group-[.toaster]:bg-white group-[.toaster]:text-slate-900",
          info: "group-[.toaster]:border-blue-200 group-[.toaster]:bg-white group-[.toaster]:text-slate-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
