export interface ActionLogEntry {
  id: string;
  timestamp: string;
  timeString: string;
  action: string;
  status: "success" | "error";
  details: string;
}

const STORAGE_KEY = "mini_saas_pos_activity_logs";
const MAX_LOGS = 50;

export function getActionLogs(): ActionLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordActionLog(entry: {
  action: string;
  status: "success" | "error";
  details: string;
}): ActionLogEntry {
  const now = new Date();
  const newEntry: ActionLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: now.toISOString(),
    timeString: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    action: entry.action,
    status: entry.status,
    details: entry.details,
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getActionLogs();
      const updated = [newEntry, ...existing].slice(0, MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("action-log-updated", { detail: newEntry }));
    } catch {
    }
  }

  return newEntry;
}

export function clearActionLogs(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("action-log-updated", { detail: null }));
    } catch {
    }
  }
}
