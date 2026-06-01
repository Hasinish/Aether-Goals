import { useEffect, useRef } from "react";

interface UseBottomSheetDragProps {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  scrollRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  closeThreshold?: number;
  ignoreSelector?: string;
}

export function useBottomSheetDrag({
  sheetRef,
  scrollRef,
  onClose,
  closeThreshold = 90,
  ignoreSelector = '[data-subtask-grip="true"], [data-no-sheet-drag="true"]',
}: UseBottomSheetDragProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // --- State variables ---
    let wasDragging = false;
    let clickTimeout: NodeJS.Timeout | null = null;

    // --- Touch dragging states ---
    let startX = 0;
    let startY = 0;
    let mode: "undecided" | "sheet" | "scroll" = "undecided";
    let currentDrag = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let isDraggingGesture = false;
    let activeScrollEl: HTMLElement | null = null;

    // Helper to find scrollable parent container dynamically
    const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      if (!node || node === sheet) return null;
      if (node.scrollHeight > node.clientHeight + 1) {
        const style = window.getComputedStyle(node);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          return node;
        }
      }
      return getScrollParent(node.parentElement);
    };

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(ignoreSelector)) {
        return;
      }

      isDraggingGesture = true;
      // Dynamically resolve the scrollable element if not explicitly provided
      activeScrollEl = scrollRef?.current || getScrollParent(target);
      const insideScroll = !!activeScrollEl;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      lastY = startY;
      lastTime = performance.now();
      velocity = 0;
      currentDrag = 0;

      if (!insideScroll) {
        mode = "sheet";
        wasDragging = false;
        sheet.style.transition = "none";
      } else {
        mode = "undecided";
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingGesture) return;

      const y = e.touches[0].clientY;
      const x = e.touches[0].clientX;
      const now = performance.now();
      const dt = now - lastTime;
      const frameDelta = y - lastY;

      if (dt > 0) {
        velocity = frameDelta / dt;
      }
      lastY = y;
      lastTime = now;

      const deltaY = y - startY;
      const deltaX = x - startX;

      if (mode === "undecided") {
        const absDeltaY = Math.abs(deltaY);
        const absDeltaX = Math.abs(deltaX);

        if (absDeltaY > 8 || absDeltaX > 8) {
          if (absDeltaY > absDeltaX) {
            if (deltaY > 0 && (!activeScrollEl || activeScrollEl.scrollTop <= 1)) {
              mode = "sheet";
              startY = y;
              wasDragging = false;
              sheet.style.transition = "none";
            } else {
              mode = "scroll";
            }
          } else {
            mode = "scroll";
          }
        } else {
          // Preemptively block native scroll/bounce initiation on any down drag at top
          if (deltaY > 0 && (!activeScrollEl || activeScrollEl.scrollTop <= 1) && e.cancelable) {
            e.preventDefault();
          }
        }
      } else if (mode === "scroll") {
        if (activeScrollEl && activeScrollEl.scrollTop <= 1 && frameDelta > 0) {
          mode = "sheet";
          startY = y; // Reset startY to drag smoothly from 0
          wasDragging = false;
          sheet.style.transition = "none";
        }
      }

      if (mode === "sheet") {
        if (e.cancelable) {
          e.preventDefault();
        }
        currentDrag = Math.max(0, y - startY);
        if (currentDrag > 4) {
          wasDragging = true;
        }
        sheet.style.transform = `translateY(${currentDrag}px)`;
      }
    };

    const onTouchEnd = () => {
      if (!isDraggingGesture) return;
      isDraggingGesture = false;

      if (mode === "sheet" || currentDrag > 0) {
        if (clickTimeout) clearTimeout(clickTimeout);
        if (currentDrag > 4) {
          wasDragging = true;
          clickTimeout = setTimeout(() => {
            wasDragging = false;
          }, 100);
        } else {
          wasDragging = false;
        }

        if (currentDrag > closeThreshold || velocity > 0.5) {
          onCloseRef.current();
        } else {
          sheet.style.transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";
          sheet.style.transform = "translateY(0px)";
        }
      }
      mode = "undecided";
      currentDrag = 0;
      activeScrollEl = null;
    };

    // --- Mouse/Pointer dragging states ---
    let pointerActive = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerMode: "undecided" | "sheet" | "scroll" = "undecided";
    let pointerCurrentDrag = 0;
    let pointerLastY = 0;
    let pointerLastTime = 0;
    let pointerVelocity = 0;
    let pointerActiveScrollEl: HTMLElement | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch handled by native touch listeners
      if (e.button !== 0) return; // Only left click

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(ignoreSelector)) {
        return;
      }

      pointerActive = true;
      pointerActiveScrollEl = scrollRef?.current || getScrollParent(target);
      const insideScroll = !!pointerActiveScrollEl;

      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      pointerLastY = pointerStartY;
      pointerLastTime = performance.now();
      pointerVelocity = 0;
      pointerCurrentDrag = 0;

      if (!insideScroll) {
        pointerMode = "sheet";
        wasDragging = false;
        sheet.style.transition = "none";
      } else {
        pointerMode = "undecided";
      }

      try {
        sheet.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointerActive) return;

      const y = e.clientY;
      const x = e.clientX;
      const now = performance.now();
      const dt = now - pointerLastTime;
      const frameDelta = y - pointerLastY;

      if (dt > 0) {
        pointerVelocity = frameDelta / dt;
      }
      pointerLastY = y;
      pointerLastTime = now;

      const deltaY = y - pointerStartY;
      const deltaX = x - pointerStartX;

      if (pointerMode === "undecided") {
        const absDeltaY = Math.abs(deltaY);
        const absDeltaX = Math.abs(deltaX);

        if (absDeltaY > 8 || absDeltaX > 8) {
          if (absDeltaY > absDeltaX) {
            if (deltaY > 0 && (!pointerActiveScrollEl || pointerActiveScrollEl.scrollTop <= 1)) {
              pointerMode = "sheet";
              pointerStartY = y;
              wasDragging = false;
              sheet.style.transition = "none";
            } else {
              pointerMode = "scroll";
            }
          } else {
            pointerMode = "scroll";
          }
        }
      } else if (pointerMode === "scroll") {
        if (pointerActiveScrollEl && pointerActiveScrollEl.scrollTop <= 1 && frameDelta > 0) {
          pointerMode = "sheet";
          pointerStartY = y; // Reset startY to drag sheet smoothly from 0
          wasDragging = false;
          sheet.style.transition = "none";
        }
      }

      if (pointerMode === "sheet") {
        pointerCurrentDrag = Math.max(0, y - pointerStartY);
        if (pointerCurrentDrag > 4) {
          wasDragging = true;
        }
        sheet.style.transform = `translateY(${pointerCurrentDrag}px)`;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointerActive) return;
      pointerActive = false;

      try {
        sheet.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (pointerMode === "sheet" || pointerCurrentDrag > 0) {
        if (clickTimeout) clearTimeout(clickTimeout);
        if (pointerCurrentDrag > 4) {
          wasDragging = true;
          clickTimeout = setTimeout(() => {
            wasDragging = false;
          }, 100);
        } else {
          wasDragging = false;
        }

        if (pointerCurrentDrag > closeThreshold || pointerVelocity > 0.5) {
          onCloseRef.current();
        } else {
          sheet.style.transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";
          sheet.style.transform = "translateY(0px)";
        }
      }
      pointerMode = "undecided";
      pointerCurrentDrag = 0;
      pointerActiveScrollEl = null;
    };

    // --- Click suppression capture handler ---
    const onClickCapture = (e: MouseEvent) => {
      if (wasDragging) {
        e.preventDefault();
        e.stopPropagation();
        wasDragging = false;
        if (clickTimeout) clearTimeout(clickTimeout);
      }
    };

    // Attach listeners
    sheet.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });

    sheet.addEventListener("pointerdown", onPointerDown);
    sheet.addEventListener("pointermove", onPointerMove);
    sheet.addEventListener("pointerup", onPointerUp);
    sheet.addEventListener("pointercancel", onPointerUp);

    sheet.addEventListener("click", onClickCapture, true);

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart, { capture: true });
      sheet.removeEventListener("touchmove", onTouchMove, { capture: true });
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);

      sheet.removeEventListener("pointerdown", onPointerDown);
      sheet.removeEventListener("pointermove", onPointerMove);
      sheet.removeEventListener("pointerup", onPointerUp);
      sheet.removeEventListener("pointercancel", onPointerUp);

      sheet.removeEventListener("click", onClickCapture, true);

      if (clickTimeout) clearTimeout(clickTimeout);
    };
  }, [closeThreshold, ignoreSelector, sheetRef, scrollRef]);
}
