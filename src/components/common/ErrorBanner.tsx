import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  message?: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md">
      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
      <span>{message}</span>
    </div>
  );
}
