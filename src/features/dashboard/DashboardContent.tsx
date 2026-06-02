"use client";

import React from "react";
import { useGoalsStore } from "@/lib/store";
import { useHabitsStore } from "@/lib/habitStore";
import { useDeadlinesStore } from "@/lib/deadlineStore";
import { Goal, Habit, Deadline } from "@/lib/types";
import { useToast } from "./components/ToastProvider";
import { TabContent } from "./components/TabContent";
import { GreetingHero } from "./components/GreetingHero";
import { BentoHeroCard, BentoGrid, SectionHeader } from "./components/BentoGridComponents";
import { GoalCard } from "../goals/components/GoalCard";
import { HabitCard } from "../habits/components/HabitCard";
import { FeaturedDeadline, DeadlineListItem } from "../deadlines/components/DeadlineCard";
import { AddItemSheet } from "../items/components/AddItemSheet";
import { EditItem } from "../items/types";
import { SettingsSheet } from "../settings/components/SettingsSheet";
import { DetailDrawer, ActiveDrawer } from "./components/DetailDrawer";
import { BottomNav } from "./components/BottomNav";
import { ChooseUsernameModal } from "./components/ChooseUsernameModal";
import { SpringDrawer } from "../ui/drawer/SpringDrawer";
import { mapDeadlineProps } from "@/features/deadlines/utils/deadlineStatus";

export default function DashboardContent() {
  const [activeNav, setActiveNav] = React.useState("home");
  const [activeDrawer, setActiveDrawer] = React.useState<ActiveDrawer | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const toast = useToast();

  const handleNavChange = React.useCallback((id: string) => {
    if (id === "add") {
      setIsAddOpen(true);
    } else if (id === "settings") {
      setIsSettingsOpen(true);
    } else {
      setActiveNav(id);
    }
  }, []);
  
  const { 
    goals, 
    syncError: goalsSyncError, 
    clearSyncError: clearGoalsSyncError 
  } = useGoalsStore();

  const { 
    habits, 
    logCompletion, 
    syncError: habitsSyncError, 
    clearSyncError: clearHabitsSyncError 
  } = useHabitsStore();

  const { 
    deadlines, 
    toggleDeadlineCompletion, 
    syncError: deadlinesSyncError, 
    clearSyncError: clearDeadlinesSyncError 
  } = useDeadlinesStore();

  const [editingItem, setEditingItem] = React.useState<EditItem | null>(null);

  // ─── DYNAMIC METRICS FOR BENTO & HOME CURATION ──────────────────────────────

  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / goals.length)
    : 0;

  const bentoStreakHabit = habits.length > 0
    ? habits.reduce<Habit>((highest, h) => {
        return (h.streak || 0) > (highest.streak || 0) ? h : highest;
      }, habits[0])
    : null;

  const activeDeadlines = deadlines.filter(d => !d.completed);
  const closestDeadline = activeDeadlines.length > 0
    ? activeDeadlines.reduce<Deadline>((closest, d) => {
        return new Date(d.due_date).getTime() < new Date(closest.due_date).getTime() ? d : closest;
      }, activeDeadlines[0])
    : (deadlines.length > 0 ? deadlines[0] : null);

  const completedHabitsTodayCount = habits.filter(h => (h.completionsToday || 0) >= h.daily_target).length;
  const totalHabitsCount = habits.length;

  const bestGoal = goals.length > 0
    ? goals.reduce<Goal>((best, g) => {
        return (g.progressPercent || 0) > (best.progressPercent || 0) ? g : best;
      }, goals[0])
    : null;

  const activeHabit = habits.length > 0
    ? (habits.find(h => (h.completionsToday || 0) > 0) || habits[0])
    : null;

  const laggingHabit = habits.length > 1
    ? (habits.find(h => (h.completionsToday || 0) < h.daily_target && h.id !== activeHabit?.id) ||
       habits.find(h => h.id !== activeHabit?.id) ||
       habits[1])
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        :root {
          /* Backgrounds */
          --bg:        #141414;
          --card:      #1e1e1e;
          --card-2:    #252525;
          --card-3:    #2a2a2a;

          /* Accent */
          --ac:        #ccff00;
          --ac-soft:   rgba(204,255,0,0.12);
          --ac-mid:    rgba(204,255,0,0.35);

          /* Text */
          --t1:        #ffffff;
          --t2:        #9a9a9a;
          --t3:        #555555;

          /* Borders */
          --b1:        rgba(255,255,255,0.07);
          --b2:        rgba(255,255,255,0.13);

          /* Semantic */
          --danger:    #ff5c5c;
          --ok:        #4ade80;
          --warn:      #fbbf24;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          background: #141414;
        }

        ::-webkit-scrollbar {
          display: none;
        }

        input::placeholder {
          color: #555555;
          opacity: 1;
        }
        
        input:focus {
          outline: none;
          border-color: rgba(204, 255, 0, 0.4) !important;
          box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.08);
        }

        @keyframes fillBar {
          from { width: 0; }
          to   { width: 67%; }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.9);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.91);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes stripGrow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }

        @keyframes pillIn {
          from { opacity: 0.5; transform: scale(0.85); }
          to   { opacity: 1;   transform: scale(1); }
        }

        .drawer-sheet {
          transform: translateY(100%);
          opacity: 0;
          transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease;
        }
        .drawer-sheet.open {
          transform: translateY(0);
          opacity: 1;
        }
      `}</style>

      <div style={{
        background: "var(--bg)",
        minHeight: "100vh",
        maxWidth: 390,
        margin: "0 auto",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        paddingBottom: "calc(100px + env(safe-area-inset-bottom))",
        position: "relative",
        overflowX: "hidden",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale"
      }}>
        {/* Main Content */}
        <div style={{ padding: "0 20px" }}>
          {/* Header section trigger profile -> settings */}
          <GreetingHero onProfileClick={() => handleNavChange("settings")} />

          {/* Sync Error Banner */}
          {(goalsSyncError || habitsSyncError || deadlinesSyncError) && (
            <div style={{
              background: "rgba(255, 92, 92, 0.1)",
              border: "1px solid rgba(255, 92, 92, 0.25)",
              borderRadius: 16,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              animation: "fadeUp 0.3s ease both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 12, color: "#ff5c5c", fontWeight: 600, lineHeight: 1.4 }}>
                  {goalsSyncError || habitsSyncError || deadlinesSyncError}
                </span>
              </div>
              <button 
                onClick={() => {
                  if (goalsSyncError) clearGoalsSyncError();
                  if (habitsSyncError) clearHabitsSyncError();
                  if (deadlinesSyncError) clearDeadlinesSyncError();
                }}
                style={{
                  background: "none", border: "none", color: "var(--t2)",
                  fontSize: 14, cursor: "pointer", padding: 4, fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>
          )}

          <TabContent id="home" active={activeNav}>
            {/* Hero Bento grid section */}
            <BentoHeroCard onDrawer={setActiveDrawer} onNav={handleNavChange} />
            <BentoGrid 
              onNav={handleNavChange} 
              onDrawer={setActiveDrawer} 
              streakHabit={bentoStreakHabit}
              closestDeadline={closestDeadline}
              overallProgress={overallProgress}
              completedHabits={completedHabitsTodayCount}
              totalHabits={totalHabitsCount}
            />

            {/* Curated Goal section (Only show 1 best/trending goal) */}
            {bestGoal && (
              <>
                <SectionHeader title="Curated Goal" onSeeAll={() => handleNavChange('goals')} style={{ marginTop: 24 }} />
                <GoalCard
                  title={bestGoal.title}
                  progress={bestGoal.progressPercent || 0}
                  tags={bestGoal.tags}
                  delta={bestGoal.deltaPercent !== undefined ? `${bestGoal.deltaPercent >= 0 ? '+' : ''}${bestGoal.deltaPercent}%` : "Tracking"}
                  done={bestGoal.subtasks?.filter(s => s.is_complete).length || 0}
                  total={bestGoal.subtasks?.length || 0}
                  animDelay={200}
                  onClick={() => setActiveDrawer({ type: "goal", data: bestGoal })}
                />
              </>
            )}

            {/* Curated Habits section (Active doing and Lagging behind) */}
            {habits.length > 0 && (
              <>
                <SectionHeader title="Daily Habits" onSeeAll={() => handleNavChange('habits')} style={{ marginTop: 28 }} />
                {activeHabit && (
                  <HabitCard
                    name={activeHabit.title}
                    target={activeHabit.daily_target}
                    done={activeHabit.completionsToday || 0}
                    streak={activeHabit.streak || 0}
                    rate={activeHabit.daily_target > 0 ? Math.round(((activeHabit.completionsToday || 0) / activeHabit.daily_target) * 100) : 0}
                    animDelay={400}
                    onClick={() => setActiveDrawer({ type: "habit", data: activeHabit })}
                    onCheckIn={async () => {
                      try {
                        await logCompletion(activeHabit.id);
                        toast(`${activeHabit.title} checked in! 🔥`);
                      } catch {
                        toast('Failed to check in habit. Please try again.', 'error');
                      }
                    }}
                  />
                )}
                {laggingHabit && laggingHabit.id !== activeHabit?.id && (
                  <HabitCard
                    name={laggingHabit.title}
                    target={laggingHabit.daily_target}
                    done={laggingHabit.completionsToday || 0}
                    streak={laggingHabit.streak || 0}
                    rate={laggingHabit.daily_target > 0 ? Math.round(((laggingHabit.completionsToday || 0) / laggingHabit.daily_target) * 100) : 0}
                    animDelay={480}
                    onClick={() => setActiveDrawer({ type: "habit", data: laggingHabit })}
                    onCheckIn={async () => {
                      try {
                        await logCompletion(laggingHabit.id);
                        toast(`${laggingHabit.title} checked in! 🔥`);
                      } catch {
                        toast('Failed to check in habit. Please try again.', 'error');
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* Curated Deadline section (Only show the single closest/urgent deadline) */}
            {closestDeadline && (
              <>
                <SectionHeader title="Closest Deadline" onSeeAll={() => handleNavChange('deadlines')} style={{ marginTop: 28 }} />
                <FeaturedDeadline 
                  {...mapDeadlineProps(closestDeadline)}
                  onToggle={async () => {
                    try {
                      await toggleDeadlineCompletion(closestDeadline.id);
                      toast(closestDeadline.completed ? 'Marked incomplete' : `${closestDeadline.title} marked complete! ✓`);
                    } catch (err) {
                      toast('Failed to update deadline. Please try again.', 'error');
                      throw err;
                    }
                  }}
                  onClick={() => setActiveDrawer({ type: "deadline", data: closestDeadline })} 
                />
              </>
            )}
          </TabContent>

          <TabContent id="goals" active={activeNav}>
            <SectionHeader title="All Active Goals" style={{ marginTop: 8 }} />
            {goals.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
                <p className="text-xs text-neutral-300 font-light">No goals tracked. Tap Add to create your first goal.</p>
              </div>
            ) : (
              goals.map((g, i) => (
                <GoalCard 
                  key={g.id} 
                  title={g.title}
                  progress={g.progressPercent || 0}
                  tags={g.tags}
                  delta={g.deltaPercent !== undefined ? `${g.deltaPercent >= 0 ? '+' : ''}${g.deltaPercent}%` : "Tracking"}
                  done={g.subtasks?.filter(s => s.is_complete).length || 0}
                  total={g.subtasks?.length || 0}
                  animDelay={100 + i * 80} 
                  onClick={() => setActiveDrawer({ type: "goal", data: g })} 
                />
              ))
            )}
          </TabContent>

          <TabContent id="habits" active={activeNav}>
            <SectionHeader title="Daily Habits Checklist" style={{ marginTop: 8 }} />
            {habits.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
                <p className="text-xs text-neutral-300 font-light">No habits tracked. Tap Add to create your first habit.</p>
              </div>
            ) : (
              habits.map((h, i) => (
                <HabitCard 
                  key={h.id} 
                  name={h.title}
                  target={h.daily_target}
                  done={h.completionsToday || 0}
                  streak={h.streak || 0}
                  rate={h.daily_target > 0 ? Math.round(((h.completionsToday || 0) / h.daily_target) * 100) : 0}
                  animDelay={100 + i * 80} 
                  onClick={() => setActiveDrawer({ type: "habit", data: h })} 
                  onCheckIn={async () => {
                    try {
                      await logCompletion(h.id);
                      toast(`${h.title} checked in! 🔥`);
                    } catch {
                      toast('Failed to check in habit. Please try again.', 'error');
                    }
                  }}
                />
              ))
            )}
          </TabContent>

          <TabContent id="deadlines" active={activeNav}>
            <SectionHeader title="All Deadlines" style={{ marginTop: 8 }} />
            {deadlines.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
                <p className="text-xs text-neutral-300 font-light">No deadlines tracked. Tap Add to create your first deadline.</p>
              </div>
            ) : (
              <>
                {closestDeadline && (
                  <FeaturedDeadline 
                    {...mapDeadlineProps(closestDeadline)} 
                    onToggle={async () => {
                      try {
                        await toggleDeadlineCompletion(closestDeadline.id);
                        toast(closestDeadline.completed ? 'Marked incomplete' : `${closestDeadline.title} marked complete! ✓`);
                      } catch (err) {
                        toast('Failed to update deadline. Please try again.', 'error');
                        throw err;
                      }
                    }}
                    onClick={() => setActiveDrawer({ type: "deadline", data: closestDeadline })} 
                  />
                )}
                {deadlines.filter(d => d.id !== closestDeadline?.id).map((d, i) => (
                  <DeadlineListItem 
                    key={d.id} 
                    index={i + 2} 
                    {...mapDeadlineProps(d)} 
                    onClick={() => setActiveDrawer({ type: "deadline", data: d })} 
                  />
                ))}
              </>
            )}
          </TabContent>

        </div>

        {/* Spring Bottom Sheet Drawer Details Overlay */}
        <DetailDrawer 
          activeDrawer={activeDrawer} 
          onClose={() => setActiveDrawer(null)} 
          onEditTap={(type, data) => {
            if (type === "goal") {
              setEditingItem({ type, data: data as Goal });
            } else if (type === "habit") {
              setEditingItem({ type, data: data as Habit });
            } else if (type === "deadline") {
              setEditingItem({ type, data: data as Deadline });
            }
            setIsAddOpen(true);
            setActiveDrawer(null);
          }}
        />

        {/* Spring Bottom Sheet Drawer for adding/editing items */}
        <SpringDrawer
          isOpen={isAddOpen}
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Edit Item" : "Create Item"}
        >
          <AddItemSheet 
            onClose={() => {
              setIsAddOpen(false);
              setEditingItem(null);
            }} 
            editItem={editingItem}
            onCreate={(type) => {
              setIsAddOpen(false);
              setEditingItem(null);
              if (type === 'goal') {
                setActiveNav('goals');
              } else if (type === 'habit') {
                setActiveNav('habits');
              } else if (type === 'deadline') {
                setActiveNav('deadlines');
              }
            }}
          />
        </SpringDrawer>

        {/* Spring Bottom Sheet Drawer for Settings */}
        <SpringDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Settings"
        >
          <SettingsSheet 
            onNav={(tab) => {
              setIsSettingsOpen(false);
              handleNavChange(tab);
            }} 
          />
        </SpringDrawer>

        {/* Sticky centered Bottom Navigation Bar */}
        <BottomNav active={activeNav} onSelect={handleNavChange} />
      </div>

      <ChooseUsernameModal />
    </>
  );
}
