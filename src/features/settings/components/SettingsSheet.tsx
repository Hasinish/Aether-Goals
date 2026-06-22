"use client";

import React from "react";

import { useGoalsStore } from "@/lib/store";
import { useDeadlinesStore } from "@/lib/deadlineStore";
import { useToast } from "../../dashboard/components/ToastProvider";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

interface SettingsSheetProps {
  onNav: (id: string) => void;
}

export function SettingsSheet({ onNav }: SettingsSheetProps) {
  const toast = useToast();
  const { logout, username, updateUsername, user } = useGoalsStore();
  const { notificationsEnabled, toggleNotifications } = useDeadlinesStore();
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = React.useState(false);

  const isGuest = user?.id === "guest-id";

  // Profile Editor state
  const [editUsername, setEditUsername] = React.useState(username);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Delete Account state
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync state if username loaded later
  React.useEffect(() => {
    setEditUsername(username);
  }, [username]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editUsername.trim().length < 3) {
      toast("Username must be at least 3 characters", "error");
      return;
    }
    if (password && password !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (password && password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update username if changed
      if (editUsername.trim() !== username) {
        await updateUsername(editUsername.trim());
      }

      // 2. Update password if provided
      if (password) {
        const client = getSupabaseClient();
        const { error: passError } = await client.auth.updateUser({
          password: password,
        });
        if (passError) throw passError;
        setPassword("");
        setConfirmPassword("");
      }

      toast("Profile updated successfully!", "success");
      setIsEditingProfile(false);
    } catch (err) {
      toast((err as { message?: string }).message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || confirmEmail !== user.email) {
      toast("Email does not match", "error");
      return;
    }

    setIsDeleting(true);
    try {
      const client = getSupabaseClient();
      const { data: { session } } = await client.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("No active session found");
      }

      const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const deleteUrl = rawBase ? `${rawBase}/api/delete-account` : "/api/delete-account";
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`Failed to parse response as JSON. Status: ${response.status}. Raw response: ${text.slice(0, 200)}`);
      }
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to delete account");
      }

      toast("Account successfully deleted", "success");
      await logout();
      window.location.reload();
    } catch (err) {
      toast((err as { message?: string }).message || "Failed to delete account", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeletingAccount) {
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
        <div style={{
          position: 'absolute', top: 0, left: 14, right: 14, height: 1,
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Delete Account
        </h2>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, lineHeight: 1.4 }}>
          This action is permanent and cannot be undone. All your goals, subtasks, habits, deadlines, and profile information will be permanently wiped.
        </p>

        <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email confirmation Input Bento Cell */}
          <div style={{
            background: 'var(--bg)', borderRadius: 16,
            border: '1px solid var(--b1)', padding: '12px 18px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Confirm your email ({user?.email})
            </label>
            <input
              type="email"
              placeholder="Type your email to confirm"
              value={confirmEmail}
              onChange={e => setConfirmEmail(e.target.value)}
              required
              disabled={isDeleting}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600, padding: 0, width: '100%',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                setIsDeletingAccount(false);
                setConfirmEmail("");
              }}
              disabled={isDeleting}
              style={{
                flex: 1, height: 46, borderRadius: 14, background: 'var(--card-3)', border: 'none',
                color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || confirmEmail !== user?.email}
              style={{
                flex: 2, height: 46, borderRadius: 14,
                background: confirmEmail === user?.email ? 'var(--danger)' : 'var(--card-3)',
                border: 'none',
                color: confirmEmail === user?.email ? '#fff' : 'var(--t3)',
                fontSize: 13, fontWeight: 800, cursor: confirmEmail === user?.email ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: confirmEmail === user?.email ? '0 4px 14px rgba(255,92,92,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {isDeleting ? "Deleting..." : "Delete My Account"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (isEditingProfile) {
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
        <div style={{
          position: 'absolute', top: 0, left: 14, right: 14, height: 1,
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Edit Profile
        </h2>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
          Manage your account credentials & identity.
        </p>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Username Input Bento Cell */}
          <div style={{
            background: 'var(--bg)', borderRadius: 16,
            border: '1px solid var(--b1)', padding: '12px 18px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Username"
              value={editUsername}
              onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              required
              disabled={isSaving}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600, padding: 0, width: '100%',
              }}
            />
          </div>

          {/* New Password Input Bento Cell */}
          <div style={{
            background: 'var(--bg)', borderRadius: 16,
            border: '1px solid var(--b1)', padding: '12px 18px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New Password (Optional)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSaving}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600, padding: 0, width: '100%',
              }}
            />
          </div>

          {/* Confirm Password Input Bento Cell */}
          <div style={{
            background: 'var(--bg)', borderRadius: 16,
            border: '1px solid var(--b1)', padding: '12px 18px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isSaving}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600, padding: 0, width: '100%',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(false);
                setEditUsername(username);
                setPassword("");
                setConfirmPassword("");
              }}
              disabled={isSaving}
              style={{
                flex: 1, height: 46, borderRadius: 14, background: 'var(--card-3)', border: 'none',
                color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 2, height: 46, borderRadius: 14, background: 'var(--ac)', border: 'none',
                color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(204,255,0,0.3)',
              }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  interface SettingsItem {
    title: string;
    subtitle: string;
    action: string;
    actionColor?: string;
    onClick: () => void;
  }

  const settingsItems: SettingsItem[] = [
    {
      title: "Edit Profile",
      subtitle: "Update your username and account password",
      action: "Manage",
      onClick: () => setIsEditingProfile(true),
    },
    {
      title: "Deadline Reminders",
      subtitle: "Get alerts 5 days before (12:01 PM) plus hourly countdowns",
      action: isTogglingNotifications ? "..." : (notificationsEnabled ? "On" : "Off"),
      actionColor: notificationsEnabled ? 'var(--ok)' : 'var(--t3)',
      onClick: async () => {
        if (isTogglingNotifications) return;
        setIsTogglingNotifications(true);
        try {
          const success = await toggleNotifications(!notificationsEnabled);
          if (success) {
            toast(
              !notificationsEnabled 
                ? "Deadline reminders enabled!" 
                : "Deadline reminders disabled.", 
              "success"
            );
          } else {
            toast("Permission denied. Check system settings.", "error");
          }
        } catch (e) {
          console.error(e);
          toast("Failed to update notification settings", "error");
        } finally {
          setIsTogglingNotifications(false);
        }
      },
    },
    {
      title: "Trigger Test Notification",
      subtitle: "Sends a local test notification in 5 seconds to verify permissions",
      action: "Test",
      onClick: async () => {
        if (!notificationsEnabled) {
          toast("Please enable 'Deadline Reminders' first!", "error");
          return;
        }
        toast("Test notification scheduled for 5 seconds!", "info");
        try {
          if (Capacitor.isNativePlatform()) {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: 99999,
                  title: "Aether Goals Test Alert",
                  body: "This is a local test notification. It works! 🎉",
                  schedule: { at: new Date(Date.now() + 5000) },
                  smallIcon: "res://icon",
                }
              ]
            });
          } else {
            // Web browser test notification - use Service Worker showNotification immediately to support mobile browsers
            if (Notification.permission === "granted") {
              if ("serviceWorker" in navigator) {
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification("Aether Goals Test Alert", {
                  body: "This is a PWA test notification. It works! 🎉",
                  icon: "/icon-192.png",
                  badge: "/badge.svg",
                });
              } else {
                new Notification("Aether Goals Test Alert", {
                  body: "This is a local test notification. It works! 🎉",
                  icon: "/icon-192.png",
                });
              }
            } else {
              toast("Web notification permission not granted.", "error");
            }
          }
        } catch (e) {
          console.error(e);
          toast("Failed to schedule test notification", "error");
        }
      },
    },
    {
      title: "Dashboard Colors",
      subtitle: "Theme customization (Coming soon)",
      action: "Locked",
      actionColor: 'var(--t3)',
      onClick: () => {},
    },
    {
      title: "Supabase Config",
      subtitle: "Environment variables are present. This does not verify database health.",
      action: isSupabaseConfigured() ? "Configured" : "Missing",
      actionColor: isSupabaseConfigured() ? 'var(--ok)' : 'var(--danger)',
      onClick: () => {
        if (isSupabaseConfigured()) {
          toast('Supabase env vars are configured. Full sync health is verified when data loads/saves.', 'info');
        } else {
          toast('Supabase is not configured. Check your env variables.', 'error');
        }
      },
    },
  ];

  if (user && !isGuest) {
    settingsItems.push({
      title: "Delete Account",
      subtitle: "Permanently delete your account and all data",
      action: "Delete",
      actionColor: 'var(--danger)',
      onClick: () => setIsDeletingAccount(true),
    });
  }

  settingsItems.push(
    {
      title: "Sign Out",
      subtitle: "Sign out of your session securely",
      action: "Exit",
      actionColor: 'var(--danger)',
      onClick: async () => {
        try {
          await logout();
          toast("Logged out successfully", "success");
        } catch {
          toast("Could not log out. Please try again.", "error");
        }
      },
    },
    {
      title: "Back to Home",
      subtitle: "Return to dashboard",
      action: "Go →",
      onClick: () => onNav('home'),
    }
  );

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
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.5px' }}>
        Settings
      </h2>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
        Configure your dashboard & preferences.
      </p>

      {/* Settings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {settingsItems.map((item, idx) => {
          const isLocked = item.title === "Dashboard Colors";
          return (
            <div 
              key={idx}
              role="button"
              tabIndex={isLocked ? -1 : 0}
              aria-disabled={isLocked ? "true" : undefined}
              onClick={isLocked ? undefined : item.onClick}
              onKeyDown={e => {
                if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  item.onClick();
                }
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: 'var(--bg)',
                borderRadius: 16,
                border: '1px solid var(--b1)',
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'border-color 0.2s, transform 0.2s',
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = 'var(--b2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = 'var(--b1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
              onFocus={e => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = 'var(--b2)';
                }
              }}
              onBlur={e => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = 'var(--b1)';
                }
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{item.subtitle}</div>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: item.actionColor || 'var(--ac)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--b1)',
                padding: '4px 10px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {item.action}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
