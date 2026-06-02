"use client";

import { useEffect, useRef, useCallback } from "react";

interface SpringDrawerDragProps {
  isOpen: boolean;
  onClose: () => void;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  scrollRef?: React.RefObject<HTMLElement | null>;
  closeThreshold?: number; // pixel distance to dismiss
  velocityThreshold?: number; // velocity to dismiss (px/ms)
}

function isInteractiveElement(el: HTMLElement): boolean {
  const tagName = el.tagName.toLowerCase();
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "button" ||
    tagName === "select" ||
    tagName === "option" ||
    tagName === "a"
  ) {
    return true;
  }
  
  if (el.getAttribute("role") === "button" || el.getAttribute("role") === "checkbox") {
    return true;
  }
  
  if (el.closest('[data-no-drag="true"]') || el.closest('[data-subtask-grip="true"]')) {
    return true;
  }
  
  return false;
}

export function useSpringDrawerDrag({
  isOpen,
  onClose,
  sheetRef,
  scrollRef,
  closeThreshold = 100,
  velocityThreshold = 0.55,
}: SpringDrawerDragProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Keep track of internal state
  const dragYRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const wasDraggingRef = useRef(false);

  // Active scrollable parent
  const activeScrollElRef = useRef<HTMLElement | null>(null);
  const dragModeRef = useRef<"undecided" | "sheet" | "scroll">("undecided");

  // Spring animation ref
  const animFrameIdRef = useRef<number | null>(null);

  // Helper to find scrollable container dynamically
  const getScrollParent = useCallback((node: HTMLElement | null, sheet: HTMLElement): HTMLElement | null => {
    if (!node || node === sheet) return null;
    if (node.scrollHeight > node.clientHeight + 1) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return node;
      }
    }
    return getScrollParent(node.parentElement, sheet);
  }, []);

  // Spring solver: animate dragY to 0
  const startSpringBack = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    const stiffness = 0.18; // Stiffness of spring
    const damping = 0.76;   // Damping ratio
    const mass = 1.0;

    let y = dragYRef.current;
    let v = velocityRef.current;
    const target = 0;

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const sheet = sheetRef.current;
      if (!sheet) return;

      const dt = Math.min(timestamp - lastTimestamp, 16); // cap dt to avoid exploding
      lastTimestamp = timestamp;

      // Spring physics
      const force = -stiffness * (y - target) - damping * v;
      const acc = force / mass;
      v += acc * dt;
      y += v * dt;

      dragYRef.current = y;
      velocityRef.current = v;

      sheet.style.transform = `translate3d(0, ${Math.max(0, y)}px, 0)`;

      if (Math.abs(y - target) < 0.1 && Math.abs(v) < 0.01) {
        sheet.style.transform = "translate3d(0, 0px, 0)";
        dragYRef.current = 0;
        velocityRef.current = 0;
      } else {
        animFrameIdRef.current = requestAnimationFrame(step);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  }, [sheetRef]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // --- Pointer Drag handlers (strictly for mouse interactions) ---
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch handled by native touch listeners
      if (e.button !== 0) return; // Only left click

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (isInteractiveElement(target)) return;

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      isDraggingRef.current = true;
      wasDraggingRef.current = false;
      pointerIdRef.current = e.pointerId;

      const sheet = sheetRef.current;
      if (sheet) {
        activeScrollElRef.current = scrollRef?.current || getScrollParent(target, sheet);
      }
      const insideScroll = !!activeScrollElRef.current;

      startYRef.current = e.clientY;
      lastYRef.current = e.clientY;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;

      if (!insideScroll) {
        dragModeRef.current = "sheet";
        if (sheet) sheet.style.transition = "none";
      } else {
        dragModeRef.current = "undecided";
      }

      try {
        sheet?.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;

      const y = e.clientY;
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      const frameDelta = y - lastYRef.current;

      if (dt > 0) {
        velocityRef.current = frameDelta / dt;
      }
      lastYRef.current = y;
      lastTimeRef.current = now;

      const deltaY = y - startYRef.current;
      const activeScrollEl = activeScrollElRef.current;

      if (dragModeRef.current === "undecided") {
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaY > 6) {
          if (deltaY > 0 && (!activeScrollEl || activeScrollEl.scrollTop <= 0)) {
            dragModeRef.current = "sheet";
            startYRef.current = y;
            wasDraggingRef.current = false;
            if (sheet) sheet.style.transition = "none";
          } else {
            dragModeRef.current = "scroll";
          }
        }
      } else if (dragModeRef.current === "scroll") {
        if (activeScrollEl && activeScrollEl.scrollTop <= 0 && frameDelta > 0) {
          dragModeRef.current = "sheet";
          startYRef.current = y;
          wasDraggingRef.current = false;
          if (sheet) sheet.style.transition = "none";
        }
      }

      if (dragModeRef.current === "sheet") {
        const currentDrag = Math.max(0, y - startYRef.current);
        if (currentDrag > 3) {
          wasDraggingRef.current = true;
        }
        dragYRef.current = currentDrag;
        sheet.style.transform = `translate3d(0, ${currentDrag}px, 0)`;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
      isDraggingRef.current = false;
      pointerIdRef.current = null;

      try {
        sheet.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (dragModeRef.current === "sheet" && dragYRef.current > 0) {
        const currentDrag = dragYRef.current;
        const velocity = velocityRef.current;

        if (currentDrag > closeThreshold || velocity > velocityThreshold) {
          sheet.style.transition = "transform 0.28s cubic-bezier(0.32, 0.94, 0.6, 1)";
          sheet.style.transform = "translate3d(0, 100%, 0)";
          
          setTimeout(() => {
            onCloseRef.current();
            if (sheetRef.current) {
              sheetRef.current.style.transform = "";
              sheetRef.current.style.transition = "";
            }
            dragYRef.current = 0;
            velocityRef.current = 0;
          }, 280);
        } else {
          startSpringBack();
        }
      }

      dragModeRef.current = "undecided";
      activeScrollElRef.current = null;
    };

    // --- Touch Drag handlers (strictly for touch interactions) ---
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (isInteractiveElement(target)) return;

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      isDraggingRef.current = true;
      wasDraggingRef.current = false;

      const sheet = sheetRef.current;
      if (sheet) {
        activeScrollElRef.current = scrollRef?.current || getScrollParent(target, sheet);
      }
      const insideScroll = !!activeScrollElRef.current;

      const touch = e.touches[0];
      startYRef.current = touch.clientY;
      lastYRef.current = touch.clientY;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;

      if (!insideScroll) {
        dragModeRef.current = "sheet";
        if (sheet) sheet.style.transition = "none";
      } else {
        dragModeRef.current = "undecided";
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      const touch = e.touches[0];
      const y = touch.clientY;
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      const frameDelta = y - lastYRef.current;

      if (dt > 0) {
        velocityRef.current = frameDelta / dt;
      }
      lastYRef.current = y;
      lastTimeRef.current = now;

      const deltaY = y - startYRef.current;
      const activeScrollEl = activeScrollElRef.current;

      if (dragModeRef.current === "undecided") {
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaY > 6) {
          if (deltaY > 0 && (!activeScrollEl || activeScrollEl.scrollTop <= 0)) {
            dragModeRef.current = "sheet";
            startYRef.current = y;
            wasDraggingRef.current = false;
            if (sheet) sheet.style.transition = "none";
          } else {
            dragModeRef.current = "scroll";
          }
        }
      } else if (dragModeRef.current === "scroll") {
        if (activeScrollEl && activeScrollEl.scrollTop <= 0 && frameDelta > 0) {
          dragModeRef.current = "sheet";
          startYRef.current = y;
          wasDraggingRef.current = false;
          if (sheet) sheet.style.transition = "none";
        }
      }

      if (dragModeRef.current === "sheet") {
        // ONLY call preventDefault if gesture is resolved to drawer swipe drag
        if (e.cancelable) {
          e.preventDefault();
        }
        const currentDrag = Math.max(0, y - startYRef.current);
        if (currentDrag > 3) {
          wasDraggingRef.current = true;
        }
        dragYRef.current = currentDrag;
        sheet.style.transform = `translate3d(0, ${currentDrag}px, 0)`;
      }
    };

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      if (dragModeRef.current === "sheet" && dragYRef.current > 0) {
        const currentDrag = dragYRef.current;
        const velocity = velocityRef.current;

        if (currentDrag > closeThreshold || velocity > velocityThreshold) {
          sheet.style.transition = "transform 0.28s cubic-bezier(0.32, 0.94, 0.6, 1)";
          sheet.style.transform = "translate3d(0, 100%, 0)";
          
          setTimeout(() => {
            onCloseRef.current();
            if (sheetRef.current) {
              sheetRef.current.style.transform = "";
              sheetRef.current.style.transition = "";
            }
            dragYRef.current = 0;
            velocityRef.current = 0;
          }, 280);
        } else {
          startSpringBack();
        }
      }

      dragModeRef.current = "undecided";
      activeScrollElRef.current = null;
    };

    const onClickCapture = (e: MouseEvent) => {
      if (wasDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        wasDraggingRef.current = false;
      }
    };

    // Attach native touch events with { passive: false } to support programmatic scroll cancelation during active drag-downs
    sheet.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });

    sheet.addEventListener("pointerdown", onPointerDown, { capture: true });
    sheet.addEventListener("pointermove", onPointerMove, { capture: true });
    sheet.addEventListener("pointerup", onPointerUp);
    sheet.addEventListener("pointercancel", onPointerUp);
    
    sheet.addEventListener("click", onClickCapture, { capture: true });

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart, { capture: true });
      sheet.removeEventListener("touchmove", onTouchMove, { capture: true });
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);

      sheet.removeEventListener("pointerdown", onPointerDown, { capture: true });
      sheet.removeEventListener("pointermove", onPointerMove, { capture: true });
      sheet.removeEventListener("pointerup", onPointerUp);
      sheet.removeEventListener("pointercancel", onPointerUp);
      
      sheet.removeEventListener("click", onClickCapture, { capture: true });

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [sheetRef, scrollRef, closeThreshold, velocityThreshold, getScrollParent, startSpringBack]);

  // Clean up animation on unmount or when drawer is closed programmatically
  useEffect(() => {
    if (!isOpen) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      dragYRef.current = 0;
      velocityRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transform = "";
        sheetRef.current.style.transition = "";
      }
    }
  }, [isOpen, sheetRef]);
}
