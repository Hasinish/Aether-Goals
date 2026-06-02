"use client";

import React from "react";

import { useGoalsStore } from "@/lib/store";
import { useToast } from "../../dashboard/components/ToastProvider";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface SettingsSheetProps {
  onNav: (id: string) => void;
}

export function SettingsSheet({ onNav }: SettingsSheetProps) {
  const toast = useToast();
  const { logout, username, updateUsername } = useGoalsStore();
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);

  // Profile Editor state
  const [editUsername, setEditUsername] = React.useState(username);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

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
    {
      title: "Download Android App",
      subtitle: "Install standalone Android wrapper (APK)",
      action: "Get APK",
      actionColor: "var(--ac)",
      onClick: () => {
        const link = document.createElement("a");
        link.href = "/aether-goals.apk";
        link.download = "aether-goals.apk";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast("Starting APK download...", "success");
      },
    },
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
    },
  ];

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
