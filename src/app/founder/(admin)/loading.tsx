import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/common/TableSkeleton";

export default function FounderLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in-50 duration-150">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-6 w-52 bg-slate-200" />
        <Skeleton className="h-4 w-80 bg-slate-200/70" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 bg-slate-200" />
              <Skeleton className="h-8 w-8 rounded-md bg-slate-200" />
            </div>
            <Skeleton className="h-7 w-28 bg-slate-200" />
            <Skeleton className="h-3 w-36 bg-slate-200/60" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TableSkeleton rows={5} columns={6} />
      </div>
    </div>
  );
}
