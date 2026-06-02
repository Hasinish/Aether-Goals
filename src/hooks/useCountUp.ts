import { useState, useEffect, useRef } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms using
 * an ease-out cubic curve with optional animation delay.
 */
export function useCountUp(target: number, duration = 800, delay = 0): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const prevTargetRef = useRef<number>(target);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const startValue = prevTargetRef.current === target ? 0 : current;
    prevTargetRef.current = target;
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startValue + (target - startValue) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        rafRef.current = requestAnimationFrame(step);
      }, delay);
    } else {
      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, delay]);

  return current;
}
