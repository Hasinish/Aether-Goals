import { Goal, Habit, Deadline } from "@/lib/types";

export type EditItem =
  | { type: "goal"; data: Goal }
  | { type: "habit"; data: Habit }
  | { type: "deadline"; data: Deadline };

export interface AddItemSheetProps {
  onClose: () => void;
  onCreate?: (type: "goal" | "habit" | "deadline") => void;
  editItem?: EditItem | null;
}
