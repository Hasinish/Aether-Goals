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

