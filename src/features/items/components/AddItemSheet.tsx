"use client";

import React from "react";
import { AddItemSheetProps } from "../types";
import { useAddItemForm } from "../hooks/useAddItemForm";
import { GoalFormFields } from "./GoalFormFields";
import { HabitFormFields } from "./HabitFormFields";
import { DeadlineFormFields } from "./DeadlineFormFields";
import { DeleteConfirmOverlay } from "./DeleteConfirmOverlay";

export function AddItemSheet({ onClose, onCreate, editItem, defaultType }: AddItemSheetProps) {
  const {
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
  } = useAddItemForm({ onClose, onCreate, editItem, defaultType });

  return (
    <div style={{
      animation: 'fadeUp 0.4s ease both',
      background: 'var(--card)',
      borderRadius: 24,
      border: '1px solid var(--b1)',
      padding: 24,
      marginTop: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Visual Confirm delete overlay */}
      {showConfirmDelete && (
        <DeleteConfirmOverlay
          activeType={activeType}
          isDeleting={isDeleting}
          onCancel={() => setShowConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.5px' }}>
        {editItem ? "Edit Existing" : "Create New"} {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
        {activeType === 'goal' && "Establish a premium metrics-driven milestone."}
        {activeType === 'habit' && "Build daily routines and track consistent streaks."}
        {activeType === 'deadline' && "Set critical priorities and overdue guardrails."}
      </p>

      {/* Dynamic Selector Switcher — Disabled in Edit mode to prevent model type shifting */}
      {!editItem && (
        <div style={{
          display: 'flex',
          background: 'var(--bg)',
          borderRadius: 14,
          padding: 4,
          marginBottom: 20,
          border: '1px solid var(--b1)',
        }}>
          {(['goal', 'habit', 'deadline'] as const).map((t) => {
            const isActive = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: isActive ? 'var(--ac)' : 'transparent',
                  color: isActive ? '#000000' : 'var(--t2)',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 2px 10px rgba(204,255,0,0.2)' : 'none',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      {/* Form Input fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {activeType === 'goal' && (
          <GoalFormFields
            goalTitle={goalTitle}
            setGoalTitle={setGoalTitle}
            goalTags={goalTags}
            setGoalTags={setGoalTags}
            goalSubtasks={goalSubtasks}
            handleAddSubtaskInput={handleAddSubtaskInput}
            handleSubtaskChange={handleSubtaskChange}
            handleSubtaskRemove={handleSubtaskRemove}
          />
        )}

        {activeType === 'habit' && (
          <HabitFormFields
            habitTitle={habitTitle}
            setHabitTitle={setHabitTitle}
            habitTags={habitTags}
            setHabitTags={setHabitTags}
            habitTarget={habitTarget}
            setHabitTarget={setHabitTarget}
          />
        )}

        {activeType === 'deadline' && (
          <DeadlineFormFields
            deadlineTitle={deadlineTitle}
            setDeadlineTitle={setDeadlineTitle}
            deadlineDueDate={deadlineDueDate}
            setDeadlineDueDate={setDeadlineDueDate}
            nlpInput={nlpInput}
            setNlpInput={setNlpInput}
            parsedDate={parsedDate}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {editItem ? (
          <button 
            onClick={() => setShowConfirmDelete(true)}
            style={{
              flex: 1, height: 46, borderRadius: 12, background: 'rgba(255,92,92,0.1)', border: '1px solid var(--danger)',
              color: 'var(--danger)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Delete
          </button>
        ) : (
          <button 
            onClick={onClose}
            style={{
              flex: 1, height: 46, borderRadius: 12, background: 'var(--card-3)', border: 'none',
              color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            flex: 2, height: 46, borderRadius: 12, background: 'var(--ac)', border: 'none',
            color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(204,255,0,0.3)',
          }}
        >
          {isSubmitting ? "Saving..." : (editItem ? "Update" : "Create")} {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
        </button>
      </div>
    </div>
  );
}
