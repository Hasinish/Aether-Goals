"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface GoalFormFieldsProps {
  goalTitle: string;
  setGoalTitle: (v: string) => void;
  goalTags: string;
  setGoalTags: (v: string) => void;
  goalSubtasks: { id?: string; title: string; is_complete: boolean }[];
  handleAddSubtaskInput: () => void;
  handleSubtaskChange: (idx: number, v: string) => void;
  handleSubtaskRemove: (idx: number) => void;
}

export function GoalFormFields({
  goalTitle,
  setGoalTitle,
  goalTags,
  setGoalTags,
  goalSubtasks,
  handleAddSubtaskInput,
  handleSubtaskChange,
  handleSubtaskRemove
}: GoalFormFieldsProps) {
  return (
    <>
      <div>
        <label 
          htmlFor="goal-title-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Goal Title
        </label>
        <input 
          id="goal-title-input"
          type="text" 
          value={goalTitle}
          onChange={e => setGoalTitle(e.target.value)}
          placeholder="e.g. Launch New Website" 
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>

      <div>
        <label 
          htmlFor="goal-tags-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Tags (Comma-separated)
        </label>
        <input 
          id="goal-tags-input"
          type="text" 
          value={goalTags}
          onChange={e => setGoalTags(e.target.value)}
          placeholder="e.g. WORK, DESIGN" 
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>

      {/* Premium Interactive Checklist Builder */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Subtasks Checklist
          </label>
          <button
            type="button"
            onClick={handleAddSubtaskInput}
            style={{
              background: "transparent", border: "none", color: "var(--ac)",
              fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              outline: "none"
            }}
          >
            <Plus size={12} /> Add Task
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {goalSubtasks.map((task, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                aria-label={`Subtask deliverable #${idx + 1}`}
                value={task.title}
                onChange={e => handleSubtaskChange(idx, e.target.value)}
                placeholder={`Subtask deliverable #${idx + 1}`}
                style={{
                  flex: 1, height: 40, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--b1)",
                  padding: "0 12px", color: "#fff", fontSize: 12, fontFamily: "inherit", outline: "none"
                }}
              />
              <button
                type="button"
                aria-label={`Remove subtask #${idx + 1}`}
                onClick={() => handleSubtaskRemove(idx)}
                style={{
                  width: 32, height: 32, borderRadius: "50%", background: "rgba(255,92,92,0.1)",
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--danger)", cursor: "pointer", flexShrink: 0,
                  outline: "none"
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
