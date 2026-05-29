export interface Subtask {
  id: string;
  goal_id: string;
  title: string;
  is_complete: boolean;
  sort_order: number;
}

export interface Goal {
  id: string;
  user_id: string | null;
  title: string;
  tags: string[];
  created_at: string;
  sort_order: number;
  subtasks?: Subtask[];
  // Calculated fields for UI
  progressPercent?: number;
  deltaPercent?: number; // delta badge, e.g. +14%
  statusMessage?: string; // status message, e.g. "On track to reach the goal..."
}

// ─── Habit System ────────────────────────────────────────────────────────────

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string | null;
  log_date: string;   // "YYYY-MM-DD"
  completions: number;
}

export interface Habit {
  id: string;
  user_id: string | null;
  title: string;
  tags: string[];
  daily_target: number;   // how many check-ins per day
  sort_order: number;
  created_at: string;
  // Hydrated UI fields (not stored in DB directly)
  icon?: string;
  logs?: HabitLog[];          // logs for the current month
  completionsToday?: number;  // from today's log entry
  streak?: number;            // consecutive-day streak computed from logs
}

export interface Deadline {
  id: string;
  user_id: string | null;
  title: string;
  due_date: string; // ISO DateTime string
  completed: boolean;
  created_at: string;
}
