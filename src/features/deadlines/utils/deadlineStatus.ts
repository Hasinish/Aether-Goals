import { Deadline } from "@/lib/types";
import { DeadlineProps } from "../types";

export interface TimeRemaining {
  d: number;
  h: number;
  m: number;
  s: number;
  overdue: boolean;
}

export function formatTime(t: TimeRemaining): string {
  if (t.overdue) return "OVERDUE";
  if (t.d > 0) return `${t.d}d ${String(t.h).padStart(2, "0")}h left`;
  return `${String(t.h).padStart(2, "0")}h ${String(t.m).padStart(2, "0")}m left`;
}

export function mapDeadlineProps(deadline: Deadline): Omit<DeadlineProps, "onToggle" | "onClick"> {
  const due = new Date(deadline.due_date).getTime();
  const created = deadline.created_at ? new Date(deadline.created_at).getTime() : due - 7 * 86400000;
  const total = Math.max(3600000, due - created);
  const diff = due - Date.now();
  const isOverdue = !deadline.completed && diff <= 0;
  const isCritical = !deadline.completed && diff > 0 && diff < 24 * 3600 * 1000;
  const isHigh = !deadline.completed && diff >= 24 * 3600 * 1000 && diff < 3 * 24 * 3600 * 1000;
  
  const priority = deadline.completed 
    ? "COMPLETED" 
    : (isOverdue 
        ? "OVERDUE" 
        : (isCritical 
            ? "CRITICAL" 
            : (isHigh 
                ? "HIGH" 
                : "NORMAL")));

  const sub = deadline.completed
    ? "Completed successfully."
    : (isOverdue
        ? "This deadline is overdue."
        : (isCritical
            ? "Due soon. Finish this first."
            : "Complete before the target time."));

  return {
    id: deadline.id,
    title: deadline.title,
    sub,
    priority,
    due,
    total,
    completed: deadline.completed,
  };
}
