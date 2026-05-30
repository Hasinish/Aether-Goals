"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Deadline } from "../lib/types";
import { useDeadlinesStore } from "../lib/deadlineStore";
import { X, Calendar, Sparkles, AlertTriangle } from "lucide-react";
import * as chrono from "chrono-node";

interface DeadlineFormModalProps {
  editDeadline: Deadline | null; // null = create mode
  onClose: () => void;
}

export default function DeadlineFormModal({ editDeadline, onClose }: DeadlineFormModalProps) {
  const { addDeadline, updateDeadline } = useDeadlinesStore();

  const [title, setTitle] = useState("");
  const [nlpInput, setNlpInput] = useState("");
  const [manualDate, setManualDate] = useState(""); // YYYY-MM-DDTHH:MM
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sheet animation state
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const triggerCloseRef = useRef<() => void>(() => {});

  // Mouse-only drag refs (desktop handle)
  const mouseActiveRef = useRef(false);
  const mouseStartYRef = useRef(0);
  const mouseDragYRef = useRef(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.32s cubic-bezier(0.4, 0, 1, 1)";
      sheetRef.current.style.transform = "translateY(100%)";
    }
    setTimeout(onClose, 320);
  }, [onClose]);

  useEffect(() => { triggerCloseRef.current = triggerClose; }, [triggerClose]);

  // ── Native touch: smart scroll vs sheet-drag detection ─────────────────
  useEffect(() => {
    const sheet = sheetRef.current;
    const form = formRef.current;
    if (!sheet || !form) return;

    let startY = 0;
    let mode: "undecided" | "sheet" | "scroll" = "undecided";
    let currentDrag = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;

    const onTouchStart = (e: TouchEvent) => {
      const rawTarget = e.target as Node | null;
      if (!rawTarget) return;

      // Extract element safely (handling potential text nodes)
      const target = rawTarget instanceof Element ? rawTarget : rawTarget.parentElement;
      if (!target) return;

      const insideForm = form.contains(target);

      startY = e.touches[0].clientY;
      lastY = startY;
      lastTime = performance.now();
      velocity = 0;
      currentDrag = 0;

      if (!insideForm) {
        mode = "sheet";
      } else {
        mode = "undecided";
      }

      sheet.style.transition = "none";
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (y - lastY) / dt;
      lastY = y;
      lastTime = now;

      const deltaY = y - startY;

      if (mode === "undecided") {
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaY > 1) {
          if (deltaY > 0 && form.scrollTop <= 1) {
            mode = "sheet";
          } else {
            mode = "scroll";
          }
        } else {
          // Preemptively block native scroll/bounce initiation on any down drag at top
          if (deltaY > 0 && form.scrollTop <= 1 && e.cancelable) {
            e.preventDefault();
          }
        }
      } else if (mode === "scroll") {
        // If we are scrolling natively, but hit the top and continue pulling down
        if (form.scrollTop <= 1 && y > lastY) {
          mode = "sheet";
          startY = y; // Reset startY to drag sheet smoothly from 0
        }
      }

      if (mode === "sheet") {
        if (e.cancelable) {
          e.preventDefault();
        }
        currentDrag = Math.max(0, y - startY);
        sheet.style.transform = `translateY(${currentDrag}px)`;
      }
    };

    const onTouchEnd = () => {
      if (mode === "sheet") {
        if (currentDrag > 90 || velocity > 0.5) {
          triggerCloseRef.current();
        } else {
          sheet.style.transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";
          sheet.style.transform = "translateY(0px)";
        }
      }
      mode = "undecided";
      currentDrag = 0;
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart, { capture: true });
      sheet.removeEventListener("touchmove", onTouchMove, { capture: true });
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse-only pointer handlers for the drag handle pill ───────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    mouseActiveRef.current = true;
    mouseStartYRef.current = e.clientY;
    mouseDragYRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseActiveRef.current) return;
    const drag = Math.max(0, e.clientY - mouseStartYRef.current);
    mouseDragYRef.current = drag;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${drag}px)`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseActiveRef.current) return;
    mouseActiveRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (mouseDragYRef.current > 90) {
      triggerClose();
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";
        sheetRef.current.style.transform = "translateY(0px)";
      }
    }
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => onPointerUp(e);

  const sheetTransform = isClosing || !isMounted ? "translateY(100%)" : "translateY(0px)";
  const sheetTransition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";

  // Pre-populate when editing
  useEffect(() => {
    if (editDeadline) {
      setTitle(editDeadline.title);
      // Set manual date picker value
      const d = new Date(editDeadline.due_date);
      // Format as local YYYY-MM-DDTHH:MM
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - offset * 60 * 1000);
      const isoStr = localTime.toISOString().slice(0, 16);
      setManualDate(isoStr);
      setParsedDate(d);
      setNlpInput(""); // blank NLP since it's already saved
    } else {
      setTitle("");
      setNlpInput("");
      setManualDate("");
      setParsedDate(null);
    }
    setError("");
  }, [editDeadline]);

  // ── Real-Time NLP Parsing ────────────────────────────────────────────────
  useEffect(() => {
    if (!nlpInput.trim()) {
      // If NLP is blank, rely entirely on manualDate (if selected)
      if (manualDate) {
        setParsedDate(new Date(manualDate));
      } else {
        setParsedDate(null);
      }
      return;
    }

    const parsed = chrono.parseDate(nlpInput);
    if (parsed) {
      setParsedDate(parsed);
      // Auto-update manual date picker input to match parsed result for transparency
      const offset = parsed.getTimezoneOffset();
      const localTime = new Date(parsed.getTime() - offset * 60 * 1000);
      setManualDate(localTime.toISOString().slice(0, 16));
    } else {
      // If parsing fails, fall back to manual date
      if (manualDate) {
        setParsedDate(new Date(manualDate));
      } else {
        setParsedDate(null);
      }
    }
  }, [nlpInput, manualDate]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a deadline title.");
      return;
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      setError("Please specify a valid due date (using NLP input or manual picker).");
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDueDate = parsedDate.toISOString();
      if (editDeadline) {
        await updateDeadline(editDeadline.id, trimmedTitle, isoDueDate, editDeadline.completed);
      } else {
        await addDeadline(trimmedTitle, isoDueDate);
      }
      triggerClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save deadline";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={triggerClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[3px] transition-opacity duration-300"
        style={{ opacity: isClosing || !isMounted ? 0 : 1 }}
      />

      {/* Drawer Sheet */}
      <div
        ref={sheetRef}
        data-modal-sheet="true"
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[92vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/10 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
      >
        {/* Drag handle — visual affordance + mouse drag trigger */}
        <div 
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className="flex items-center justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-neutral-700 hover:bg-neutral-500 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-900 select-none shrink-0">
          <button
            type="button"
            onClick={triggerClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            {editDeadline ? "Edit Deadline" : "New Deadline"}
          </h3>
          <div className="w-6" />
        </div>

        {/* Scrollable Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 pb-12 space-y-6"
        >
          {error && (
            <div className="p-3.5 border border-red-900/50 bg-red-950/40 rounded-md text-xs text-red-400 leading-normal">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Deadline Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Submit proposal draft"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-850 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* NLP Date Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Sparkles size={11} className="text-cyan-400 animate-pulse" />
              <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                Type Date (Natural Language)
              </label>
            </div>
            <input
              type="text"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder="e.g., due next Tuesday at 3pm"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-850 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors font-mono"
            />
          </div>

          {/* Parsed Live Confirmation Preview */}
          {parsedDate && !isNaN(parsedDate.getTime()) ? (
            <div className="p-3.5 border border-emerald-950 bg-gradient-to-r from-emerald-950/20 to-cyan-950/20 rounded-xl flex items-start gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)] select-none">
              <Calendar size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                  Parsed Due Date Confirmation:
                </span>
                <span className="text-xs font-mono text-neutral-200">
                  {parsedDate.toLocaleString("en-US", {
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
            nlpInput && (
              <div className="p-3.5 border border-neutral-900 bg-neutral-950/60 rounded-xl flex items-start gap-2.5 select-none">
                <AlertTriangle size={14} className="text-neutral-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 block font-bold">
                    NLP Status:
                  </span>
                  <span className="text-xs text-neutral-500 font-mono italic">
                    Waiting for recognizable date syntax...
                  </span>
                </div>
              </div>
            )
          )}

          {/* Manual Fallback Date Picker */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500">
              Manual Date Fallback / Override
            </label>
            <input
              type="datetime-local"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-850 rounded-md text-sm text-neutral-400 focus:outline-none focus:border-neutral-600 transition-colors font-mono"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition-all select-none shadow-[0_0_24px_rgba(255,255,255,0.08)] active:scale-95"
            >
              {isSubmitting ? "Saving..." : editDeadline ? "Update Deadline" : "Create Deadline"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
