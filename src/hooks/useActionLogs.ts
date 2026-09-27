"use client";

import { useState, useEffect, useCallback } from "react";
import { ActionLogEntry, getActionLogs, recordActionLog, clearActionLogs } from "@/lib/action-logger";

export function useActionLogs() {
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);

  useEffect(() => {
    setLogs(getActionLogs());

    function handleUpdate() {
      setLogs(getActionLogs());
    }

    window.addEventListener("action-log-updated", handleUpdate);
    return () => window.removeEventListener("action-log-updated", handleUpdate);
  }, []);

  const addLog = useCallback((entry: { action: string; status: "success" | "error"; details: string }) => {
    recordActionLog(entry);
  }, []);

  const clearAll = useCallback(() => {
    clearActionLogs();
  }, []);

  return { logs, addLog, clearAll };
}
