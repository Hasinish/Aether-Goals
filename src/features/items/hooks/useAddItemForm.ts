"use client";

import React from "react";
import * as chrono from "chrono-node";
import { Subtask } from "@/lib/types";
import { useGoalsStore } from "@/lib/store";
import { useHabitsStore } from "@/lib/habitStore";
import { useDeadlinesStore } from "@/lib/deadlineStore";
import { useToast } from "@/features/dashboard/components/ToastProvider";
import { EditItem } from "../types";

function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

interface UseAddItemFormProps {
  onClose: () => void;
  onCreate?: (type: "goal" | "habit" | "deadline") => void;
  editItem?: EditItem | null;
  defaultType?: "goal" | "habit" | "deadline";
}

export function useAddItemForm({ onClose, onCreate, editItem, defaultType }: UseAddItemFormProps) {
  const toast = useToast();
  const { addGoal, updateGoal, deleteGoal } = useGoalsStore();
  const { addHabit, updateHabit, deleteHabit } = useHabitsStore();
  const { addDeadline, updateDeadline, deleteDeadline } = useDeadlinesStore();

  const [activeType, setActiveType] = React.useState<"goal" | "habit" | "deadline">(defaultType || "goal");

  // Form States
  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalTags, setGoalTags] = React.useState("");
  const [goalSubtasks, setGoalSubtasks] = React.useState<{ id?: string; title: string; is_complete: boolean }[]>([{ title: "", is_complete: false }]);

  const [habitTitle, setHabitTitle] = React.useState("");
  const [habitTags, setHabitTags] = React.useState("");
  const [habitTarget, setHabitTarget] = React.useState(1);

  const [deadlineTitle, setDeadlineTitle] = React.useState("");
  const [deadlineDueDate, setDeadlineDueDate] = React.useState("");
  const [nlpInput, setNlpInput] = React.useState("");
  const [parsedDate, setParsedDate] = React.useState<Date | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  // NLP Dynamic Date Parser
  React.useEffect(() => {
    if (!nlpInput.trim()) {
      if (deadlineDueDate) {
        setParsedDate(new Date(deadlineDueDate));
      } else {
        setParsedDate(null);
      }
      return;
    }

    const results = chrono.parse(nlpInput);
    if (results.length > 0) {
      const result = results[0];
      const parsed = result.date();
      if (!result.start.isCertain("hour")) {
        parsed.setHours(23, 59, 0, 0);
      }
      setParsedDate(parsed);
      const offset = parsed.getTimezoneOffset();
      const localTime = new Date(parsed.getTime() - offset * 60 * 1000);
      setDeadlineDueDate(localTime.toISOString().slice(0, 16));
    } else {
      if (deadlineDueDate) {
        setParsedDate(new Date(deadlineDueDate));
      } else {
        setParsedDate(null);
      }
    }
  }, [nlpInput, deadlineDueDate]);

  // Load edit item data if present
  React.useEffect(() => {
    if (editItem) {
      setActiveType(editItem.type);
      if (editItem.type === "goal") {
        const goalData = editItem.data;
        setGoalTitle(goalData.title);
        setGoalTags(goalData.tags?.join(", ") || "");
        setGoalSubtasks(goalData.subtasks?.map((s: Subtask) => ({
          id: s.id,
          title: s.title,
          is_complete: s.is_complete
        })) || [{ title: "", is_complete: false }]);
      } else if (editItem.type === "habit") {
        const habitData = editItem.data;
        setHabitTitle(habitData.title);
        setHabitTags(habitData.tags?.join(", ") || "");
        setHabitTarget(habitData.daily_target || 1);
      } else if (editItem.type === "deadline") {
        const deadlineData = editItem.data;
        setDeadlineTitle(deadlineData.title);
        setDeadlineDueDate(toDateTimeLocalValue(deadlineData.due_date));
        setParsedDate(new Date(deadlineData.due_date));
        setNlpInput("");
      }
    } else {
      setActiveType(defaultType || "goal");
      setGoalTitle("");
      setGoalTags("");
      setGoalSubtasks([{ title: "", is_complete: false }]);
      setHabitTitle("");
      setHabitTags("");
      setHabitTarget(1);
      setDeadlineTitle("");
      const defaultDate = new Date(Date.now() + 24 * 3600000).toISOString();
      setDeadlineDueDate(toDateTimeLocalValue(defaultDate));
      setParsedDate(new Date(defaultDate));
      setNlpInput("");
    }
  }, [editItem, defaultType]);

  const handleAddSubtaskInput = () => {
    setGoalSubtasks([...goalSubtasks, { title: "", is_complete: false }]);
  };

  const handleSubtaskChange = (idx: number, val: string) => {
    const next = [...goalSubtasks];
    next[idx] = { ...next[idx], title: val };
    setGoalSubtasks(next);
  };

  const handleSubtaskRemove = (idx: number) => {
    const filtered = goalSubtasks.filter((_, i) => i !== idx);
    setGoalSubtasks(filtered.length === 0 ? [{ title: "", is_complete: false }] : filtered);
  };

  const handleSubtaskReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const next = [...goalSubtasks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setGoalSubtasks(next);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (activeType === "goal") {
        const titleTrimmed = goalTitle.trim();
        if (!titleTrimmed) throw new Error("Title is required");
        const parsedTags = goalTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
        const subtasksFiltered = goalSubtasks.filter(s => s.title.trim() !== "");

        if (editItem && editItem.type === "goal") {
          const subtasksInput = subtasksFiltered.map((sub, idx) => ({
            id: sub.id,
            title: sub.title.trim(),
            is_complete: sub.is_complete,
            sort_order: idx
          }));
          await updateGoal(editItem.data.id, titleTrimmed, parsedTags, subtasksInput);
          toast("Goal updated successfully! ✓");
        } else {
          await addGoal(titleTrimmed, parsedTags, subtasksFiltered.map(s => s.title.trim()));
          toast("Goal created successfully! ✓");
        }
      } else if (activeType === "habit") {
        const titleTrimmed = habitTitle.trim();
        if (!titleTrimmed) throw new Error("Title is required");
        const parsedTags = habitTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
        const existingIcon = editItem && editItem.type === "habit" ? editItem.data.icon || "activity" : "activity";

        if (editItem && editItem.type === "habit") {
          await updateHabit(editItem.data.id, titleTrimmed, parsedTags, habitTarget, existingIcon);
          toast("Habit updated successfully! ✓");
        } else {
          await addHabit(titleTrimmed, parsedTags, habitTarget, existingIcon);
          toast("Habit created successfully! ✓");
        }
      } else if (activeType === "deadline") {
        const titleTrimmed = deadlineTitle.trim();
        if (!titleTrimmed) throw new Error("Title is required");
        if (!parsedDate || isNaN(parsedDate.getTime())) throw new Error("Due date is required");
        const targetDate = parsedDate.toISOString();

        if (editItem && editItem.type === "deadline") {
          await updateDeadline(editItem.data.id, titleTrimmed, targetDate, editItem.data.completed);
          toast("Deadline updated successfully! ✓");
        } else {
          await addDeadline(titleTrimmed, targetDate);
          toast("Deadline created successfully! ✓");
        }
      }

      if (onCreate) {
        onCreate(activeType);
      } else {
        onClose();
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error saving item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem || isDeleting) return;
    setIsDeleting(true);

    try {
      if (editItem.type === "goal") {
        await deleteGoal(editItem.data.id);
        toast("Goal deleted successfully ✓");
      } else if (editItem.type === "habit") {
        await deleteHabit(editItem.data.id);
        toast("Habit deleted successfully ✓");
      } else if (editItem.type === "deadline") {
        await deleteDeadline(editItem.data.id);
        toast("Deadline deleted successfully ✓");
      }
      onClose();
    } catch {
      toast("Failed to delete item", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    activeType,
    setActiveType,
    goalTitle,
    setGoalTitle,
    goalTags,
    setGoalTags,
    goalSubtasks,
    handleAddSubtaskInput,
    handleSubtaskChange,
    handleSubtaskRemove,
    handleSubtaskReorder,
    habitTitle,
    setHabitTitle,
    habitTags,
    setHabitTags,
    habitTarget,
    setHabitTarget,
    deadlineTitle,
    setDeadlineTitle,
    deadlineDueDate,
    setDeadlineDueDate,
    nlpInput,
    setNlpInput,
    parsedDate,
    isSubmitting,
    isDeleting,
    showConfirmDelete,
    setShowConfirmDelete,
    handleSubmit,
    handleDelete
  };
}
