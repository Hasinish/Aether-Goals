"use client";

import React from "react";
import { SpringDrawer } from "@/features/ui/drawer/SpringDrawer";
import { GoalDetailContent } from "./detail/GoalDetailContent";
import { HabitDetailContent } from "./detail/HabitDetailContent";
import { DeadlineDetailContent } from "./detail/DeadlineDetailContent";
import { Goal, Habit, Deadline } from "@/lib/types";

export type ActiveDrawer =
  | { type: "goal"; data: Goal }
  | { type: "habit"; data: Habit }
  | { type: "deadline"; data: Deadline };

export interface DetailDrawerProps {
  activeDrawer: ActiveDrawer | null;
  onClose: () => void;
  onEditTap?: (type: "goal" | "habit" | "deadline", data: Goal | Habit | Deadline) => void;
}

export function DetailDrawer({ activeDrawer, onClose, onEditTap }: DetailDrawerProps) {
  // Store the last active drawer to prevent content from resetting/flickering while animating closed
  const [lastActiveDrawer, setLastActiveDrawer] = React.useState<ActiveDrawer | null>(null);

  React.useEffect(() => {
    if (activeDrawer) {
      setLastActiveDrawer(activeDrawer);
    }
  }, [activeDrawer]);

  const activeItem = activeDrawer || lastActiveDrawer;
  if (!activeItem) return null;

  const { type, data } = activeItem;

  const title = type === "goal" 
    ? "Goal Details" 
    : type === "habit" 
      ? "Habit Tracker" 
      : "Urgent Deadline";

  return (
    <SpringDrawer 
      isOpen={!!activeDrawer}
      onClose={onClose} 
      title={title}
    >
      {type === "goal" && (
        <GoalDetailContent 
          goal={data} 
          onClose={onClose} 
          onEditTap={onEditTap ? (t, d) => onEditTap(t, d) : undefined} 
        />
      )}
      {type === "habit" && (
        <HabitDetailContent 
          habit={data} 
          onEditTap={onEditTap ? (t, d) => onEditTap(t, d) : undefined} 
        />
      )}
      {type === "deadline" && (
        <DeadlineDetailContent 
          deadline={data} 
          onEditTap={onEditTap ? (t, d) => onEditTap(t, d) : undefined} 
        />
      )}
    </SpringDrawer>
  );
}
