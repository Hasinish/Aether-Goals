"use client";

import React from "react";

export interface TimeRemaining {
  d: number;
  h: number;
  m: number;
  s: number;
  overdue: boolean;
}

export function useCountdown(targetDate: Date): TimeRemaining {
  const calc = React.useCallback((): TimeRemaining => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, overdue: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      overdue: false,
    };
  }, [targetDate]);

  const [time, setTime] = React.useState<TimeRemaining>(calc);

  React.useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  return time;
}
