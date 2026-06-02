"use client";

import React from "react";

interface DeadlineFormFieldsProps {
  deadlineTitle: string;
  setDeadlineTitle: (v: string) => void;
  deadlineDueDate: string;
  setDeadlineDueDate: (v: string) => void;
}

export function DeadlineFormFields({
  deadlineTitle,
  setDeadlineTitle,
  deadlineDueDate,
  setDeadlineDueDate
}: DeadlineFormFieldsProps) {
  return (
    <>
      <div>
        <label 
          htmlFor="deadline-title-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Deadline Title
        </label>
        <input 
          id="deadline-title-input"
          type="text" 
          value={deadlineTitle}
          onChange={e => setDeadlineTitle(e.target.value)}
          placeholder="e.g. CV Submission" 
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>

      <div>
        <label 
          htmlFor="deadline-due-date-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Due Date & Time
        </label>
        <input 
          id="deadline-due-date-input"
          type="datetime-local" 
          value={deadlineDueDate}
          onChange={e => setDeadlineDueDate(e.target.value)}
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>
    </>
  );
}
