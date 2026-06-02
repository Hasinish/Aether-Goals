import React from "react";
import { Sparkles, Calendar, AlertTriangle } from "lucide-react";

interface DeadlineFormFieldsProps {
  deadlineTitle: string;
  setDeadlineTitle: (v: string) => void;
  deadlineDueDate: string;
  setDeadlineDueDate: (v: string) => void;
  nlpInput: string;
  setNlpInput: (v: string) => void;
  parsedDate: Date | null;
}

export function DeadlineFormFields({
  deadlineTitle,
  setDeadlineTitle,
  deadlineDueDate,
  setDeadlineDueDate,
  nlpInput,
  setNlpInput,
  parsedDate
}: DeadlineFormFieldsProps) {
  const isParsedValid = parsedDate && !isNaN(parsedDate.getTime());

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Sparkles size={12} style={{ color: "var(--ac)", animation: "pulse 2s infinite" }} />
          <label 
            htmlFor="deadline-nlp-input"
            style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}
          >
            Type Date (Natural Language)
          </label>
        </div>
        <input 
          id="deadline-nlp-input"
          type="text" 
          value={nlpInput}
          onChange={e => setNlpInput(e.target.value)}
          placeholder="e.g. due next Tuesday at 3pm" 
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "monospace",
            outline: "none", transition: "border-color 0.2s",
          }}
        />

        {/* Live confirmation preview */}
        {isParsedValid ? (
          <div style={{
            padding: "12px 14px",
            background: "rgba(74, 222, 128, 0.06)",
            border: "1px solid rgba(74, 222, 128, 0.18)",
            borderRadius: 12,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginTop: 10,
          }}>
            <Calendar size={14} style={{ color: "var(--ok)", marginTop: 2, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "var(--ok)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Parsed Due Date Confirmation
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>
                {parsedDate!.toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ) : (
          nlpInput.trim() && (
            <div style={{
              padding: "12px 14px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--b1)",
              borderRadius: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: 10,
            }}>
              <AlertTriangle size={14} style={{ color: "var(--t3)", marginTop: 2, flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  NLP Status
                </span>
                <span style={{ fontSize: 11, color: "var(--t2)", fontStyle: "italic" }}>
                  Waiting for recognizable date syntax...
                </span>
              </div>
            </div>
          )
        )}
      </div>

      <div>
        <label 
          htmlFor="deadline-due-date-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Manual Date Fallback / Override
        </label>
        <input 
          id="deadline-due-date-input"
          type="datetime-local" 
          value={deadlineDueDate}
          onChange={e => setDeadlineDueDate(e.target.value)}
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "var(--t2)", fontSize: 13, fontFamily: "monospace",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>
    </>
  );
}
