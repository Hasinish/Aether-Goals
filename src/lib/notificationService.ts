import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { Deadline } from "./types";

// Helper to check if notifications are supported on this platform
export const isNotificationSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform() || "Notification" in window;
};

// Request permissions safely
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions();
      return status.display === "granted";
    } else {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (e) {
    console.error("Error requesting notification permissions:", e);
    return false;
  }
};

// Check permissions status
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return status.display === "granted";
    } else {
      return Notification.permission === "granted";
    }
  } catch (e) {
    console.error("Error checking notification permissions:", e);
    return false;
  }
};

// Hash a string (deadline UUID) into a unique integer
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Keep it within a safe positive 7-digit range (0 to 9,999,999)
  return Math.abs(hash) % 10000000;
}

// Generate unique base ID for a deadline's notification set
// Multiplying by 15 ensures we have 15 slots (baseId + 0 to baseId + 14) for each deadline
const getBaseNotificationId = (deadlineId: string): number => {
  return stringToHash(deadlineId) * 15;
};

// Format a Date object to YYYY-MM-DD in local time
const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Cancel all scheduled notifications for a single deadline
export const cancelDeadlineNotifications = async (deadlineId: string): Promise<void> => {
  if (!isNotificationSupported()) return;

  try {
    const baseId = getBaseNotificationId(deadlineId);
    // Cancel all 12 slots allocated for this deadline
    const idsToCancel = Array.from({ length: 12 }, (_, i) => baseId + i);

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({
        notifications: idsToCancel.map((id) => ({ id })),
      });
    }
  } catch (e) {
    console.error(`Error cancelling notifications for deadline ${deadlineId}:`, e);
  }
};

// Schedule 5-day daily warnings and 6-hour countdowns for a deadline
export const scheduleDeadlineNotifications = async (
  deadline: Deadline
): Promise<void> => {
  if (!isNotificationSupported()) return;

  // 1. Always cancel existing notifications for this deadline first
  await cancelDeadlineNotifications(deadline.id);

  // 2. Do not schedule if completed or missing due date
  if (deadline.completed || !deadline.due_date) return;

  try {
    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) return;

    const dueDate = new Date(deadline.due_date);
    const now = new Date();

    // If deadline is in the past, do not schedule
    if (dueDate.getTime() <= now.getTime()) return;

    const baseId = getBaseNotificationId(deadline.id);
    const notificationsToSchedule = [];

    // --- A. Daily Warnings (5 days down to 1 day remaining) at 12:01 PM ---
    for (let daysRemaining = 5; daysRemaining >= 1; daysRemaining--) {
      // Target date is X days before the due date
      const targetDate = new Date(dueDate.getTime() - daysRemaining * 24 * 60 * 60 * 1000);
      // Set to 12:01 PM local time
      targetDate.setHours(12, 1, 0, 0);

      // Only schedule if:
      // 1. The target date is in the future.
      // 2. The target date is strictly before the actual due date.
      if (targetDate.getTime() > now.getTime() && targetDate.getTime() < dueDate.getTime()) {
        notificationsToSchedule.push({
          id: baseId + daysRemaining, // slots baseId + 1 to baseId + 5
          title: "Deadline Reminder",
          body: `"${deadline.title}" is due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}.`,
          schedule: { at: targetDate },
          smallIcon: "res://icon", // standard drawable resource icon for Android
        });
      }
    }

    // --- B. Hourly Countdowns (6 hours down to 1 hour remaining) ---
    for (let hoursRemaining = 6; hoursRemaining >= 1; hoursRemaining--) {
      const targetDate = new Date(dueDate.getTime() - hoursRemaining * 60 * 60 * 1000);

      if (targetDate.getTime() > now.getTime()) {
        notificationsToSchedule.push({
          id: baseId + 5 + hoursRemaining, // slots baseId + 6 to baseId + 11
          title: "Deadline Countdown",
          body: `"${deadline.title}" is due in ${hoursRemaining} hour${hoursRemaining > 1 ? "s" : ""}.`,
          schedule: { at: targetDate },
          smallIcon: "res://icon",
        });
      }
    }

    // --- C. Due Now Alert (0 hours remaining) ---
    notificationsToSchedule.push({
      id: baseId + 0, // slot baseId + 0
      title: "Deadline Due",
      body: `"${deadline.title}" is due now!`,
      schedule: { at: dueDate },
      smallIcon: "res://icon",
    });

    if (Capacitor.isNativePlatform() && notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      console.log(`Scheduled ${notificationsToSchedule.length} notifications for: "${deadline.title}"`);
    } else if (!Capacitor.isNativePlatform() && "Notification" in window) {
      // In web fallback, we cannot schedule background alerts easily, but we log for debug visibility
      console.log(`[Web Placeholder] Would schedule ${notificationsToSchedule.length} alerts for "${deadline.title}"`);
    }
  } catch (e) {
    console.error(`Error scheduling notifications for deadline ${deadline.id}:`, e);
  }
};

// Schedule 9:00 AM dynamic daily count summaries for the next 14 days
export const updateDailyMorningSummaries = async (
  deadlines: Deadline[]
): Promise<void> => {
  if (!isNotificationSupported()) return;

  const summaryBaseId = 90000000;
  const summaryIds = Array.from({ length: 14 }, (_, i) => summaryBaseId + i);

  try {
    // 1. Cancel all previous morning summaries
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({
        notifications: summaryIds.map((id) => ({ id })),
      });
    }

    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) return;

    const now = new Date();
    const notificationsToSchedule = [];

    // 2. Scan the next 14 days (Day 0 = Today, Day 1 = Tomorrow, ..., Day 13)
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const morningTime = new Date();
      morningTime.setDate(morningTime.getDate() + dayOffset);
      morningTime.setHours(9, 0, 0, 0);

      // If the scheduled time is already in the past (e.g. today after 9 AM), skip it
      if (morningTime.getTime() <= now.getTime()) continue;

      const targetDateString = toLocalDateString(morningTime);

      // Count active (uncompleted) deadlines due on this target date
      const count = deadlines.filter((d) => {
        if (d.completed || !d.due_date) return false;
        const deadlineDateString = toLocalDateString(new Date(d.due_date));
        return deadlineDateString === targetDateString;
      }).length;

      // Only schedule a notification if there are deadlines due on that day
      if (count > 0) {
        notificationsToSchedule.push({
          id: summaryBaseId + dayOffset,
          title: "Good Morning",
          body: `You have ${count} deadline${count > 1 ? "s" : ""} due today.`,
          schedule: { at: morningTime },
          smallIcon: "res://icon",
        });
      }
    }

    if (Capacitor.isNativePlatform() && notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      console.log(`Scheduled ${notificationsToSchedule.length} morning summaries.`);
    } else if (!Capacitor.isNativePlatform()) {
      console.log(`[Web Placeholder] Would schedule morning summaries:`, notificationsToSchedule);
    }
  } catch (e) {
    console.error("Error updating daily morning summaries:", e);
  }
};

// Cancel all notifications (used when disabling the feature globally)
export const cancelAllNotifications = async (deadlines: Deadline[]): Promise<void> => {
  if (!isNotificationSupported()) return;

  try {
    console.log("Cancelling all scheduled notifications...");

    // 1. Cancel morning summaries
    const summaryBaseId = 90000000;
    const summaryIds = Array.from({ length: 14 }, (_, i) => summaryBaseId + i);

    // 2. Cancel all deadline-specific notifications
    const deadlineIds: number[] = [];
    deadlines.forEach((d) => {
      const baseId = getBaseNotificationId(d.id);
      for (let i = 0; i < 12; i++) {
        deadlineIds.push(baseId + i);
      }
    });

    const allIdsToCancel = [...summaryIds, ...deadlineIds];

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({
        notifications: allIdsToCancel.map((id) => ({ id })),
      });
    }
  } catch (e) {
    console.error("Error cancelling all notifications:", e);
  }
};
