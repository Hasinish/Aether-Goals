"use client";

import React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface SubtaskItem {
  id?: string;
  title: string;
  is_complete: boolean;
}

interface GoalFormFieldsProps {
  goalTitle: string;
  setGoalTitle: (v: string) => void;
  goalTags: string;
  setGoalTags: (v: string) => void;
  goalSubtasks: SubtaskItem[];
  handleAddSubtaskInput: () => void;
  handleSubtaskChange: (idx: number, v: string) => void;
  handleSubtaskRemove: (idx: number) => void;
  handleSubtaskReorder: (fromIdx: number, toIdx: number) => void;
}

export function GoalFormFields({
  goalTitle,
  setGoalTitle,
  goalTags,
  setGoalTags,
  goalSubtasks,
  handleAddSubtaskInput,
  handleSubtaskChange,
  handleSubtaskRemove,
  handleSubtaskReorder,
}: GoalFormFieldsProps) {
  // ─── Drag state: stored in refs so pointer-move never triggers re-renders ───
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const ghostRef = React.useRef<HTMLDivElement | null>(null);
  const dragFromRef = React.useRef(-1);
  const dragOverRef = React.useRef(-1);
  const offsetYRef = React.useRef(0);
  const offsetXRef = React.useRef(0);
  const rectsRef = React.useRef<DOMRect[]>([]);
  const ROW_GAP = 8; // matches the gap in the list container

  // React state: drives visual re-renders (translateY animations + ghost opacity)
  const [dragFrom, setDragFrom] = React.useState(-1);
  const [overIdx, setOverIdx] = React.useState(-1);

  // Keep item refs array in sync with list length
  React.useLayoutEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, goalSubtasks.length);
  }, [goalSubtasks.length]);

  const cleanupDrag = React.useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
    dragFromRef.current = -1;
    dragOverRef.current = -1;
    setDragFrom(-1);
    setOverIdx(-1);
  }, []);

  // ─── Pointer handlers ─────────────────────────────────────────────────────

  const handlePointerDown = React.useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    idx: number
  ) => {
    // CRITICAL: only start drag from the grip icon itself
    const target = e.target as HTMLElement;
    if (!target.closest("[data-subtask-grip='true']")) return;
    // Left click / primary touch only
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Stop the SpringDrawer from seeing this pointer event
    e.stopPropagation();
    e.preventDefault();

    const el = itemRefs.current[idx];
    if (!el) return;

    // Snapshot rects for all items before any DOM changes
    rectsRef.current = itemRefs.current.map(r => r?.getBoundingClientRect() ?? new DOMRect());
    const srcRect = rectsRef.current[idx];

    offsetXRef.current = e.clientX - srcRect.left;
    offsetYRef.current = e.clientY - srcRect.top;

    // Build ghost clone that matches the row exactly
    const ghost = el.cloneNode(true) as HTMLDivElement;
    ghost.style.cssText = `
      position: fixed;
      left: ${srcRect.left}px;
      top: ${srcRect.top}px;
      width: ${srcRect.width}px;
      height: ${srcRect.height}px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0;
      margin: 0 !important;
      z-index: 99999;
      pointer-events: none;
      touch-action: none;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1.5px rgba(204,255,0,0.6);
      background: #1e1e1e;
      opacity: 0.98;
      transform: scale(1.04);
      will-change: top, left;
      overflow: hidden;
    `;

    // cloneNode doesn't copy React-controlled .value — do it manually
    const srcInputs = el.querySelectorAll<HTMLInputElement>("input");
    const ghostInputs = ghost.querySelectorAll<HTMLInputElement>("input");
    srcInputs.forEach((srcInput, i) => {
      const gInput = ghostInputs[i];
      if (!gInput) return;
      gInput.value = srcInput.value;
      // Reset any focus / active styles so lime border doesn't show
      gInput.style.outline = "none";
      gInput.style.borderColor = "rgba(255,255,255,0.09)";
      gInput.style.boxShadow = "none";
      gInput.style.color = "#fff";
    });

    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    dragFromRef.current = idx;
    dragOverRef.current = idx;
    setDragFrom(idx);
    setOverIdx(idx);
  }, []);

  const handlePointerMove = React.useCallback((e: PointerEvent) => {
    if (dragFromRef.current === -1 || !ghostRef.current) return;
    // Stop drawer from intercepting
    e.stopPropagation();
    e.preventDefault();

    // Move ghost
    ghostRef.current.style.top = `${e.clientY - offsetYRef.current}px`;
    ghostRef.current.style.left = `${e.clientX - offsetXRef.current}px`;

    // Center Y of the ghost
    const fromRect = rectsRef.current[dragFromRef.current];
    const ghostH = fromRect?.height ?? 44;
    const ghostCenterY = e.clientY - offsetYRef.current + ghostH / 2;

    const rects = rectsRef.current;
    let newOver = dragOverRef.current;

    // Find which item slot the ghost center overlaps
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (!r) continue;
      const midY = r.top + r.height / 2;
      if (i === 0 && ghostCenterY < midY) { newOver = 0; break; }
      if (i === rects.length - 1 && ghostCenterY >= midY) { newOver = rects.length - 1; break; }
      const nextR = rects[i + 1];
      if (nextR && ghostCenterY >= midY && ghostCenterY < nextR.top + nextR.height / 2) {
        newOver = i;
        break;
      }
    }

    newOver = Math.max(0, Math.min(rects.length - 1, newOver));

    if (newOver !== dragOverRef.current) {
      dragOverRef.current = newOver;
      setOverIdx(newOver);
    }
  }, []);

  const handlePointerUp = React.useCallback((e: PointerEvent) => {
    if (dragFromRef.current === -1) return;
    e.stopPropagation();

    const from = dragFromRef.current;
    const to = dragOverRef.current;
    cleanupDrag();

    if (from !== to && from !== -1 && to !== -1) {
      handleSubtaskReorder(from, to);
    }
  }, [cleanupDrag, handleSubtaskReorder]);

  const handlePointerCancel = React.useCallback(() => {
    cleanupDrag();
  }, [cleanupDrag]);

  // Attach document-level listeners so pointer moves are tracked anywhere on screen
  React.useEffect(() => {
    document.addEventListener("pointermove", handlePointerMove, { passive: false, capture: true });
    document.addEventListener("pointerup", handlePointerUp, { capture: true });
    document.addEventListener("pointercancel", handlePointerCancel, { capture: true });
    return () => {
      document.removeEventListener("pointermove", handlePointerMove, { capture: true });
      document.removeEventListener("pointerup", handlePointerUp, { capture: true });
      document.removeEventListener("pointercancel", handlePointerCancel, { capture: true });
    };
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  // ─── Per-item translateY during drag ──────────────────────────────────────
  // Instead of reordering DOM / using CSS `order`, we compute a translateY
  // for each item so they slide smoothly with a CSS transition.
  //
  // Rule:
  //   - The dragged item (from) is invisible (ghost floats instead)
  //   - Items between from..over shift by one slot height in the opposite direction
  const getTranslateY = (idx: number): number => {
    const from = dragFrom;
    const over = overIdx;
    if (from === -1 || over === -1 || from === over || idx === from) return 0;

    // Each item height is the same; use snapshotted rect height + gap
    const rowH = (rectsRef.current[from]?.height ?? 44) + ROW_GAP;

    if (from < over) {
      // Dragging downward: items from+1 → over slide UP by one slot
      if (idx > from && idx <= over) return -rowH;
    } else {
      // Dragging upward: items over → from-1 slide DOWN by one slot
      if (idx >= over && idx < from) return rowH;
    }
    return 0;
  };

  return (
    <>
      {/* Goal Title */}
      <div>
        <label
          htmlFor="goal-title-input"
          style={{
            fontSize: 11, fontWeight: 700, color: "var(--t3)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            display: "block", marginBottom: 6,
          }}
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
            width: "100%", height: 46, borderRadius: 12,
            background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13,
            fontFamily: "inherit", outline: "none",
            transition: "border-color 0.2s",
          }}
        />
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="goal-tags-input"
          style={{
            fontSize: 11, fontWeight: 700, color: "var(--t3)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            display: "block", marginBottom: 6,
          }}
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
            width: "100%", height: 46, borderRadius: 12,
            background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13,
            fontFamily: "inherit", outline: "none",
            transition: "border-color 0.2s",
          }}
        />
      </div>

      {/* Subtasks with drag-and-drop reordering */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{
            fontSize: 11, fontWeight: 700, color: "var(--t3)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Subtasks Checklist
          </label>
          <button
            type="button"
            onClick={handleAddSubtaskInput}
            style={{
              background: "transparent", border: "none", color: "var(--ac)",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              outline: "none",
            }}
          >
            <Plus size={12} /> Add Task
          </button>
        </div>

        {/*
          The list uses position:relative + translateY per item for smooth animations.
          Items never reorder in the DOM during drag — only translateY shifts them.
          The ghost clone floats above everything.
        */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${ROW_GAP}px`,
            position: "relative",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {goalSubtasks.map((task, idx) => {
            const isDragged = dragFrom !== -1 && idx === dragFrom;
            const translateY = getTranslateY(idx);
            const isDragging = dragFrom !== -1;

            return (
              <div
                key={`subtask-${idx}`}
                ref={el => { itemRefs.current[idx] = el; }}
                onPointerDown={e => handlePointerDown(e, idx)}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  // Invisible placeholder for the dragged item — space is preserved
                  opacity: isDragged ? 0 : 1,
                  // Smooth slide animation for non-dragged items
                  transform: `translateY(${translateY}px)`,
                  transition: isDragging && !isDragged
                    ? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1), opacity 150ms ease"
                    : isDragging
                      ? "opacity 150ms ease"
                      : "none",
                  position: "relative",
                  zIndex: 1,
                  borderRadius: 12,
                }}
              >
                {/* ── Grip handle (data-subtask-grip excludes drawer pan) ── */}
                <div
                  data-subtask-grip="true"
                  aria-label="Drag to reorder subtask"
                  title="Hold and drag to reorder"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 40,
                    flexShrink: 0,
                    cursor: isDragging ? "grabbing" : "grab",
                    color: "var(--t3)",
                    touchAction: "none",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={e => {
                    if (!isDragging) e.currentTarget.style.color = "var(--ac)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "var(--t3)";
                  }}
                >
                  <GripVertical size={14} />
                </div>

                {/* ── Text input ── */}
                <input
                  type="text"
                  aria-label={`Subtask #${idx + 1}`}
                  value={task.title}
                  onChange={e => handleSubtaskChange(idx, e.target.value)}
                  placeholder={`Subtask deliverable #${idx + 1}`}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--bg)",
                    border: "1px solid var(--b1)",
                    padding: "0 12px",
                    color: "#fff",
                    fontSize: 12,
                    fontFamily: "inherit",
                    outline: "none",
                    // Disable input interaction while dragging
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                />

                {/* ── Remove button ── */}
                <button
                  type="button"
                  aria-label={`Remove subtask #${idx + 1}`}
                  onClick={() => handleSubtaskRemove(idx)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,92,92,0.1)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--danger)",
                    cursor: "pointer",
                    flexShrink: 0,
                    outline: "none",
                    transition: "background 150ms ease",
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,92,92,0.22)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,92,92,0.1)")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
