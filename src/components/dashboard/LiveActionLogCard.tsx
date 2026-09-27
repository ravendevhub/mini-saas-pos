"use client";

import { useActionLogs } from "@/hooks/useActionLogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Activity, Trash2 } from "lucide-react";

export function LiveActionLogCard() {
  const { logs, clearAll } = useActionLogs();

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Live Operation Logs</h2>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                {logs.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Realtime client session audit feed (non-database)
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-[11px] h-7 px-2 text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear Logs
          </Button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-md">
          No operations logged in this active session. User actions (sales, updates, cart actions) will appear here instantly.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const isSuccess = log.status === "success";
            return (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 truncate">{log.action}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 font-mono uppercase ${
                          isSuccess
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {isSuccess ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 break-words">
                      {log.details}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5 tabular-nums">
                  {log.timeString}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
