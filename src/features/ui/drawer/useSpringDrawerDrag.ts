"use client";

import { useEffect, useRef, useCallback } from "react";

type DragMode = "idle" | "pending" | "sheet" | "scroll" | "settling";

interface SpringDrawerDragProps {
  isOpen: boolean;
  onClose: () => void;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  scrollRef?: React.RefObject<HTMLElement | null>;
  closeThreshold?: number; // pixel distance to dismiss
  velocityThreshold?: number; // velocity to dismiss (px/ms)
  onDragStateChange?: (active: boolean) => void; // Callback to notify parent of active drag/spring phase
}

function isInteractiveElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;

  return Boolean(
    el.closest(
      [
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "option",
        "label",
        "[contenteditable='true']",
        "[role='button']",
        "[role='checkbox']",
        "[role='switch']",
        "[role='tab']",
        "[data-no-drag='true']",
        "[data-subtask-grip='true']"
      ].join(",")
    )
  );
}

function getScrollableParent(node: HTMLElement | null, sheet: HTMLElement): HTMLElement | null {
  let current = node;

  while (current && current !== sheet) {
    const style = window.getComputedStyle(current);
    const canScrollY =
      /(auto|scroll)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight + 1;

    if (canScrollY) return current;
    current = current.parentElement;
  }

  return null;
}

function afterTransition(node: HTMLElement, callback: () => void, timeoutMs: number) {
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    node.removeEventListener("transitionend", onEnd);
    callback();
  };

  const onEnd = (event: TransitionEvent) => {
    if (event.target === node && event.propertyName === "transform") {
      finish();
    }
  };

  node.addEventListener("transitionend", onEnd);
  window.setTimeout(finish, timeoutMs);
}

export function useSpringDrawerDrag({
  isOpen,
  onClose,
  sheetRef,
  scrollRef,
  closeThreshold = 100,
  velocityThreshold = 0.9, // default increased to 0.9 to prevent twitch closes
  onDragStateChange,
}: SpringDrawerDragProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Explicit state machine Ref
  const modeRef = useRef<DragMode>("idle");

  const dragYRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const wasDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const isClosingRef = useRef(false);

  // Active scrollable parent
  const activeScrollElRef = useRef<HTMLElement | null>(null);

  // Spring animation ref
  const animFrameIdRef = useRef<number | null>(null);

  // Spring solver: animate transform smoothly to 0 using CSS transition and custom ease
  const startSpringBack = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.style.transition = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
    sheet.style.transform = "translate3d(0, 0px, 0)";

    afterTransition(sheet, () => {
      sheet.style.transform = "";
      sheet.style.transition = "";
      dragYRef.current = 0;
      velocityRef.current = 0;
      modeRef.current = "idle";
      onDragStateChange?.(false); // Snapped back, resting!
    }, 300);
  }, [sheetRef, onDragStateChange]);

  const handleDragStart = useCallback((clientY: number, target: EventTarget | null, pointerId: number | null) => {
    if (isClosingRef.current || modeRef.current === "settling" || !isOpen) return;
    const el = target as HTMLElement | null;
    if (!el || isInteractiveElement(el)) return;

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    isDraggingRef.current = true;
    wasDraggingRef.current = false;
    pointerIdRef.current = pointerId;

    const sheet = sheetRef.current;
    if (sheet) {
      activeScrollElRef.current = getScrollableParent(el, sheet) || scrollRef?.current || null;
    }

    startYRef.current = clientY;
    lastYRef.current = clientY;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    modeRef.current = "pending";
  }, [sheetRef, scrollRef, isOpen]);

  const handleDragMove = useCallback((clientY: number, e: Event) => {
    if (!isDraggingRef.current) return;

    const y = clientY;
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const frameDelta = y - lastYRef.current;

    if (dt > 0) {
      const instantVelocity = Math.max(0, frameDelta / dt); // downward only
      velocityRef.current = velocityRef.current * 0.7 + instantVelocity * 0.3; // smoothing
    }
    lastYRef.current = y;
    lastTimeRef.current = now;

    const deltaY = y - startYRef.current;
    const sheet = sheetRef.current;

    if (modeRef.current === "pending") {
      const absDeltaY = Math.abs(deltaY);
      if (absDeltaY > 2) { // very small threshold to detect direction instantly
        if (deltaY < 0) {
          // Upward gesture -> let standard scrolling happen
          modeRef.current = "scroll";
        } else {
          // Downward gesture -> check if scroll container is at top
          const scrollEl = activeScrollElRef.current ?? scrollRef?.current;
          const atTop = !scrollEl || scrollEl.scrollTop <= 2; // sub-pixel safe threshold

          if (atTop) {
            modeRef.current = "sheet";
            startYRef.current = y; // Reset startY to drag smoothly starting from 0px
            if (sheet) sheet.style.transition = "none";
            onDragStateChange?.(true);
            if (e.cancelable) {
              e.preventDefault(); // prevent native scroll initiation immediately!
            }
          } else {
            modeRef.current = "scroll";
          }
        }
      }
    } else if (modeRef.current === "scroll") {
      // Scroll handoff check: transition to sheet drag if container reaches top during swipe-down
      const scrollEl = activeScrollElRef.current ?? scrollRef?.current;
      const atTop = !scrollEl || scrollEl.scrollTop <= 2; // sub-pixel safe threshold

      if (atTop && frameDelta > 0) {
        modeRef.current = "sheet";
        startYRef.current = y; // Reset startY to drag smoothly starting from 0px
        if (sheet) sheet.style.transition = "none";
        onDragStateChange?.(true);
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }

    if (modeRef.current === "sheet" && sheet) {
      if (e.cancelable) {
        e.preventDefault(); // Only preventDefault during active sheet dragging
      }
      const currentDrag = Math.max(0, y - startYRef.current);
      if (currentDrag > 6) {
        wasDraggingRef.current = true;
        suppressClickRef.current = true; // suppress accidental click trigger on release
      }
      dragYRef.current = currentDrag;
      sheet.style.transform = `translate3d(0, ${currentDrag}px, 0)`;
    }
  }, [sheetRef, scrollRef, onDragStateChange]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    pointerIdRef.current = null;

    const sheet = sheetRef.current;
    if (!sheet) return;

    if (modeRef.current === "sheet") {
      const dragY = dragYRef.current;
      const velocityY = velocityRef.current;

      const shouldCloseByDistance = dragY >= closeThreshold;
      const shouldCloseByVelocity = dragY >= 32 && velocityY >= velocityThreshold; // Downward-only velocity + minimum distance

      const shouldClose = shouldCloseByDistance || shouldCloseByVelocity;

      if (shouldClose) {
        isClosingRef.current = true;
        modeRef.current = "settling";
        
        sheet.style.transition = "transform 240ms cubic-bezier(0.4, 0, 1, 1), opacity 180ms ease";
        sheet.style.transform = "translate3d(0, 100%, 0)";

        afterTransition(sheet, () => {
          onCloseRef.current();
          if (sheetRef.current) {
            sheetRef.current.style.transform = "";
            sheetRef.current.style.transition = "";
          }
          dragYRef.current = 0;
          velocityRef.current = 0;
          isClosingRef.current = false;
          modeRef.current = "idle";
          onDragStateChange?.(false);
        }, 280);
      } else {
        modeRef.current = "settling";
        startSpringBack();
      }

      // Reset suppress click soon in case no click event is fired by browser
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 50);
    } else {
      modeRef.current = "idle";
      onDragStateChange?.(false);
    }

    activeScrollElRef.current = null;
  }, [sheetRef, closeThreshold, velocityThreshold, startSpringBack, onDragStateChange]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const animFrameId = animFrameIdRef.current;

    // --- Pointer events for mouse tracking ---
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch handled by native touch listeners
      if (e.button !== 0) return; // Only left click
      handleDragStart(e.clientY, e.target, e.pointerId);
      try {
        sheet.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (pointerIdRef.current !== e.pointerId) return;
      handleDragMove(e.clientY, e);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (pointerIdRef.current !== e.pointerId) return;
      try {
        sheet.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      handleDragEnd();
    };

    // --- Touch events for mobile swiping ---
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragStart(touch.clientY, e.target, null);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientY, e);
    };

    const onTouchEnd = () => {
      handleDragEnd();
    };

    // Click suppression handler
    const onClickCapture = (e: MouseEvent) => {
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClickRef.current = false;
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

      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [isOpen, sheetRef, scrollRef, handleDragStart, handleDragMove, handleDragEnd]);

  // Clean up animation on unmount or when drawer is closed programmatically
  useEffect(() => {
    const animFrameId = animFrameIdRef.current;
    if (!isOpen) {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      dragYRef.current = 0;
      velocityRef.current = 0;
      modeRef.current = "idle";
      isClosingRef.current = false;
      if (sheetRef.current) {
        sheetRef.current.style.transform = "";
        sheetRef.current.style.transition = "";
      }
    }
  }, [isOpen, sheetRef]);
}
