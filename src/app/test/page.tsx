"use client";

import React, { useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
import { useGoalsStore } from "@/lib/store";
import { Goal, Habit, Deadline } from "@/lib/types";
import AuthScreen from "@/components/AuthScreen";
import GoalCard from "@/components/GoalCard";
import HabitCard from "@/components/HabitCard";
import DeadlineCard from "@/components/DeadlineCard";
import GoalDetailModal from "@/components/GoalDetailModal";
import GoalFormModal from "@/components/GoalFormModal";
import HabitFormModal from "@/components/HabitFormModal";
import DeadlineFormModal from "@/components/DeadlineFormModal";
import HabitAnalyticsModal from "@/components/HabitAnalyticsModal";
import AetherLogo from "@/components/AetherLogo";
import { HabitStoreProvider, useHabitsStore } from "@/lib/habitStore";
import { DeadlineStoreProvider, useDeadlinesStore } from "@/lib/deadlineStore";
import { LogOut, Plus, Search } from "lucide-react";
import ConstellationBackground from "@/components/ConstellationBackground";

export default function Home() {
  const { user } = useGoalsStore();

  // Authenticate Gate
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <HabitStoreProvider user={user}>
      <DeadlineStoreProvider user={user}>
        <HomeContent />
      </DeadlineStoreProvider>
    </HabitStoreProvider>
  );
}

function HomeContent() {
  const { goals, loading, user: rawUser, logout, reorderGoals, syncError: goalsSyncError, clearSyncError: clearGoalsSyncError } = useGoalsStore();
  const { habits, loading: habitsLoading, syncError: habitsSyncError, clearSyncError: clearHabitsSyncError } = useHabitsStore();
  const { deadlines, loading: deadlinesLoading, syncError: deadlinesSyncError, clearSyncError: clearDeadlinesSyncError } = useDeadlinesStore();
  
  const user = rawUser!;
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isHeaderCompressed, setIsHeaderCompressed] = useState(false);
  const [activeTab, setActiveTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const [prevTab, setPrevTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStartPos({ x: clientX, y: clientY });
  };

  const handleDragEnd = (clientX: number, clientY: number) => {
    if (!dragStartPos) return;
    const diffX = dragStartPos.x - clientX;
    const diffY = dragStartPos.y - clientY;

    // Horizontal swipe threshold: 50px difference horizontally, and mostly horizontal path
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        if (activeTab === "deadlines") {
          setPrevTab("deadlines");
          setActiveTab("goals");
        } else if (activeTab === "goals") {
          setPrevTab("goals");
          setActiveTab("habits");
        }
      } else {
        if (activeTab === "habits") {
          setPrevTab("habits");
          setActiveTab("goals");
        } else if (activeTab === "goals") {
          setPrevTab("goals");
          setActiveTab("deadlines");
        }
      }
    }
    setDragStartPos(null);
  };

  const cardRectsRef = React.useRef<Record<string, DOMRect>>({});
  const prevGoalsRef = React.useRef<Goal[]>([]);
  const isReorderingRef = React.useRef(false);
  const tagsRef = React.useRef<HTMLDivElement>(null);
  // Track which card IDs have already played their entrance animation
  const introducedIdsRef = React.useRef<Set<string>>(new Set());

  // Get all unique tags for the horizontal tag filters (Memoized at top to avoid conditional hook early returns)
  const allTags = React.useMemo(() => {
    return Array.from(
      new Set(goals.flatMap((g) => g.tags))
    ).filter(Boolean);
  }, [goals]);

  const allHabitTags = React.useMemo(() => {
    return Array.from(
      new Set(habits.flatMap((h) => h.tags || []))
    ).filter(Boolean);
  }, [habits]);

  const tagsToDisplay = activeTab === "habits" ? allHabitTags : allTags;

  // Clear selected tag when tab changes to avoid tag leakage
  React.useEffect(() => {
    setSelectedTag(null);
  }, [activeTab]);

  // Filtering (Memoized at top to avoid Temporal Dead Zone reference errors during AuthScreen early return)
  const filteredGoals = React.useMemo(() => {
    return goals.filter((g) => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !selectedTag || g.tags.includes(selectedTag);

      let matchesTab = true;
      if (activeTab === "deadlines") {
        matchesTab = g.tags.some(t => t.toLowerCase() === "deadline") || g.title.toLowerCase().includes("deadline");
      } else if (activeTab === "habits") {
        matchesTab = false; // Now handled by habits store
      } else if (activeTab === "goals") {
        matchesTab = !g.tags.some(t => t.toLowerCase() === "habit") && 
                     !g.tags.some(t => t.toLowerCase() === "deadline") && 
                     !g.title.toLowerCase().includes("deadline");
      }

      return matchesSearch && matchesTag && matchesTab;
    });
  }, [goals, searchQuery, selectedTag, activeTab]);

  const measureCards = () => {
    const elements = document.querySelectorAll("[data-drag-id]");
    const rects: Record<string, DOMRect> = {};
    elements.forEach((el) => {
      const id = el.getAttribute("data-drag-id");
      if (id) {
        rects[id] = el.getBoundingClientRect();
      }
    });
    cardRectsRef.current = rects;
  };

  const animateCards = () => {
    const elements = document.querySelectorAll("[data-drag-id]") as NodeListOf<HTMLElement>;
    const movedElements: Array<{ el: HTMLElement }> = [];

    elements.forEach((el) => {
      const id = el.getAttribute("data-drag-id");
      if (!id) return;
      const firstRect = cardRectsRef.current[id];
      if (!firstRect) return;

      const lastRect = el.getBoundingClientRect();
      const deltaX = firstRect.left - lastRect.left;
      const deltaY = firstRect.top - lastRect.top;

      if (deltaX !== 0 || deltaY !== 0) {
        el.style.transition = "none";
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        movedElements.push({ el });
      }
    });

    if (movedElements.length === 0) return;

    // Force browser layout flush so the inverted transforms are committed before the next paint
    void document.body.offsetHeight;

    requestAnimationFrame(() => {
      movedElements.forEach(({ el }) => {
        el.style.transition = "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "translate(0px, 0px)";
      });

      setTimeout(() => {
        movedElements.forEach(({ el }) => {
          el.style.transition = "";
          el.style.transform = "";
        });
      }, 380);
    });
  };

  // Mark all currently-visible card IDs as introduced after each render
  React.useEffect(() => {
    if (!user) return;
    if (activeTab === "habits") {
      habits.forEach((h) => introducedIdsRef.current.add(h.id));
    } else {
      filteredGoals.forEach((g) => introducedIdsRef.current.add(g.id));
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (isReorderingRef.current && prevGoalsRef.current.length > 0) {
      animateCards();
    }
    prevGoalsRef.current = goals;
    isReorderingRef.current = false;
  }, [goals]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsHeaderCompressed(true);
      } else {
        setIsHeaderCompressed(false);
      }
    };
    // Initialize immediately on mount in case page is already scrolled
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    const el = tagsRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      isDragging = false;
    };

    const onMouseLeave = () => {
      isDown = false;
    };

    const onMouseUp = () => {
      if (isDragging) {
        const preventClick = (e: MouseEvent) => {
          e.stopImmediatePropagation();
          el.removeEventListener("click", preventClick, true);
        };
        el.addEventListener("click", preventClick, true);
      }
      isDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
    };
  }, [goals]);

  // Handle Actions
  const handleCardTap = (goal: Goal) => {
    setSelectedGoalId(goal.id);
  };

  const handleEditTap = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleEditHabitTap = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleEditDeadlineTap = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setIsFormOpen(true);
  };

  const handleAddTap = () => {
    setEditingGoal(null);
    setEditingHabit(null);
    setEditingDeadline(null);
    setIsFormOpen(true);
  };

  const handleModalEditTrigger = (goal: Goal) => {
    setSelectedGoalId(null);
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    measureCards();
    isReorderingRef.current = true;
    reorderGoals(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= filteredGoals.length - 1) return;
    measureCards();
    isReorderingRef.current = true;
    reorderGoals(idx, idx + 1);
  };

  const renderPageContent = (type: "deadlines" | "goals" | "habits") => {
    if (type === "habits") {
      const pageHabits = habits.filter((h) => {
        const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (h.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesTag = !selectedTag || (h.tags || []).some(t => t.toLowerCase() === selectedTag.toLowerCase());

        return matchesSearch && matchesTag;
      });

      if (habitsLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
            <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase animate-pulse">
              Syncing Ledger
            </span>
          </div>
        );
      }

      if (pageHabits.length === 0) {
        return (
          <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
            <p className="text-xs text-neutral-300 font-light">
              No recurring habits tracked in this node.
            </p>
            <button
              onClick={handleAddTap}
              className="px-4 py-2 border border-neutral-850 hover:border-neutral-600 bg-neutral-950 text-[10px] uppercase font-mono tracking-widest text-neutral-300 hover:text-white rounded-md transition-all"
            >
              Initialize Habit
            </button>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 gap-3.5">
          {pageHabits.map((habit, idx) => {
            const isNew = !introducedIdsRef.current.has(habit.id);
            return (
              <div
                key={habit.id}
                data-drag-id={habit.id}
                className={isNew ? "animate-card-entrance" : undefined}
                style={isNew ? { animationDelay: `${idx * 60}ms` } : undefined}
              >
                <HabitCard
                  habit={habit}
                  onTap={(h) => setSelectedHabitId(h.id)}
                  onEditTap={handleEditHabitTap}
                  entranceDelay={idx * 70}
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (type === "deadlines") {
      const pageDeadlines = deadlines.filter((d) => {
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });

      if (deadlinesLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
            <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase animate-pulse">
              Syncing Ledger
            </span>
          </div>
        );
      }

      if (pageDeadlines.length === 0) {
        return (
          <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
            <p className="text-xs text-neutral-300 font-light">
              No active deadlines found in this timeline.
            </p>
            <button
              onClick={handleAddTap}
              className="px-4 py-2 border border-neutral-850 hover:border-neutral-600 bg-neutral-950 text-[10px] uppercase font-mono tracking-widest text-neutral-300 hover:text-white rounded-md transition-all"
            >
              Initialize Deadline
            </button>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 gap-3.5">
          {pageDeadlines.map((deadline) => (
            <DeadlineCard
              key={deadline.id}
              deadline={deadline}
              onEditTap={handleEditDeadlineTap}
            />
          ))}
        </div>
      );
    }

    // Filter goals for this specific page (Goals and Deadlines tabs)
    const pageGoals = goals.filter((g) => {
      // 1. Search Query filter
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 2. Horizontal Tag filter
      const matchesTag = !selectedTag || g.tags.includes(selectedTag);

      // 3. Tab filter
      let matchesTab = true;
      if (type === "goals") {
        matchesTab = !g.tags.some(t => t.toLowerCase() === "habit") && 
                     !g.tags.some(t => t.toLowerCase() === "deadline") && 
                     !g.title.toLowerCase().includes("deadline");
      }

      return matchesSearch && matchesTag && matchesTab;
    });

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase animate-pulse">
            Syncing Ledger
          </span>
        </div>
      );
    }

    if (pageGoals.length === 0) {
      return (
        <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
          <p className="text-xs text-neutral-300 font-light">
            No matching records found in this universe.
          </p>
          <button
            onClick={handleAddTap}
            className="px-4 py-2 border border-neutral-850 hover:border-neutral-600 bg-neutral-950 text-[10px] uppercase font-mono tracking-widest text-neutral-300 hover:text-white rounded-md transition-all"
          >
            Initialize Goal
          </button>
        </div>
      );
    }

    // Disable reordering on filtered views to prevent index misalignment with global store
    const canReorder = type === "goals" && !searchQuery && !selectedTag;

    return (
      <div className="grid grid-cols-1 gap-3.5">
        {pageGoals.map((goal, idx) => {
          const isNew = !introducedIdsRef.current.has(goal.id);
          return (
            <div
              key={goal.id}
              data-drag-id={goal.id}
              className={isNew ? "animate-card-entrance" : undefined}
              style={isNew ? { animationDelay: `${idx * 60}ms` } : undefined}
            >
              <GoalCard
                goal={goal}
                onTap={handleCardTap}
                onEditTap={handleEditTap}
                onMoveUp={canReorder ? (e) => { e.stopPropagation(); handleMoveUp(idx); } : undefined}
                onMoveDown={canReorder ? (e) => { e.stopPropagation(); handleMoveDown(idx); } : undefined}
                isFirst={idx === 0}
                isLast={idx === pageGoals.length - 1}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const syncError = goalsSyncError || habitsSyncError;
  const handleClearSyncError = () => {
    if (goalsSyncError) clearGoalsSyncError();
    if (habitsSyncError) clearHabitsSyncError();
  };

  return (
    <div 
      className="min-h-screen bg-black text-white md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 pb-28 relative flex flex-col overflow-hidden"
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
    >
      <ConstellationBackground opacity={0.45} particleCount={200} />
      
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 mx-auto z-40 w-full md:max-w-md bg-[#0d0d0d]/80 backdrop-blur-md border-b transition-all duration-300 ease-out flex items-center justify-between ${
        isHeaderCompressed
          ? "py-3 px-6 border-neutral-800 shadow-[0_4px_30px_rgba(0,0,0,0.85)]"
          : "py-5 px-6 border-neutral-900/60 shadow-none"
      }`}>
        <div className={`flex items-center gap-2 select-none transition-transform duration-300 ease-out origin-left ${
          isHeaderCompressed ? "scale-[0.91]" : "scale-100"
        }`}>
          <div className="w-2 h-2 rounded-full animate-breath-cyan-green" />
          <AetherLogo />
        </div>

        <div className={`flex items-center gap-2.5 transition-transform duration-300 ease-out origin-right ${
          isHeaderCompressed ? "scale-[0.91]" : "scale-100"
        }`}>
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-300 hidden sm:inline-block mr-1.5">
            {user === "guest" ? "Guest Sandbox" : user.email?.split("@")[0]}
          </span>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) {
                setSearchQuery(""); // Clear query when closing search bar
              }
            }}
            className={`p-2 rounded-lg transition-all ${
              showSearch 
                ? "text-white bg-neutral-900" 
                : "text-neutral-500 hover:text-white hover:bg-neutral-900"
            }`}
            aria-label="Toggle Search"
          >
            <Search size={16} />
          </button>

          <button
            onClick={() => logout()}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-all"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-6 pt-24 pb-6 space-y-6">
        {/* Navigation Tabs (Deadlines, Goals, Habits) with Morphing Pill Switcher */}
        <div className="relative flex w-full bg-neutral-950 border border-neutral-900 rounded-xl p-1 select-none shrink-0 overflow-hidden">
          {/* Sliding Indicator Background */}
          {(() => {
            const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
            const currentIndex = tabIndices[activeTab];
            const prevIndex = tabIndices[prevTab];
            return (
              <div 
                className="absolute inset-y-0"
                style={{
                  left: `${currentIndex * 33.333}%`,
                  right: `${(2 - currentIndex) * 33.333}%`,
                  transition: 
                    currentIndex > prevIndex
                      ? "right 320ms cubic-bezier(0.34, 1.8, 0.45, 1), left 380ms cubic-bezier(0.4, 0, 0.2, 1) 40ms"
                      : currentIndex < prevIndex
                        ? "left 320ms cubic-bezier(0.34, 1.8, 0.45, 1), right 380ms cubic-bezier(0.4, 0, 0.2, 1) 40ms"
                        : "left 300ms ease-out, right 300ms ease-out"
                }}
              >
                <div className="w-full h-full p-1">
                  <div className="w-full h-full bg-white rounded-lg shadow-md" />
                </div>
              </div>
            );
          })()}

          {[
            { id: "deadlines" as const, label: "Deadlines" },
            { id: "goals" as const, label: "Goals" },
            { id: "habits" as const, label: "Habits" }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPrevTab(activeTab);
                  setActiveTab(item.id);
                }}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg transition-colors duration-300 relative z-10 ${
                  isActive 
                    ? "text-black font-extrabold" 
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar (Toggled) */}
        {showSearch && (
          <div className="relative animate-fade-in">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals or tags..."
              className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors animate-fade-in"
            />
          </div>
        )}

        {/* Tag Filters Row */}
        {tagsToDisplay.length > 0 && (
          <div 
            ref={tagsRef}
            className="flex items-center gap-1.5 overflow-x-auto pb-2.5 -mx-6 px-6 touch-pan-x flex-nowrap shrink-0 pointer-events-auto select-none cursor-grab active:cursor-grabbing"
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono rounded-lg border transition-all ${
                !selectedTag
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-neutral-300 border-neutral-900 hover:text-neutral-200"
              }`}
            >
              {activeTab === "habits" ? "All Habits" : activeTab === "deadlines" ? "All Deadlines" : "All Goals"}
            </button>
            {tagsToDisplay.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono rounded-lg border transition-all shrink-0 ${
                  selectedTag === tag
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-neutral-300 border-neutral-900 hover:text-neutral-200"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Viewport Slider Track */}
        <div className="w-full overflow-hidden py-2 -my-2">
          <div 
            className="flex w-[300%] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              transform: 
                activeTab === "deadlines"
                  ? "translateX(0%)"
                  : activeTab === "goals"
                    ? "translateX(-33.333%)"
                    : "translateX(-66.666%)"
            }}
          >
            {/* Page 1: Deadlines */}
            <div className="w-1/3 shrink-0">
              {renderPageContent("deadlines")}
            </div>

            {/* Page 2: Goals */}
            <div className="w-1/3 shrink-0">
              {renderPageContent("goals")}
            </div>

            {/* Page 3: Habits */}
            <div className="w-1/3 shrink-0">
              {renderPageContent("habits")}
            </div>
          </div>
        </div>
      </main>

      {/* Global Sync Error Banner */}
      {syncError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-full max-w-sm px-6 pointer-events-none">
          <div className="flex items-center justify-between p-4 bg-red-950/90 border border-red-900 rounded-lg shadow-2xl backdrop-blur-md pointer-events-auto">
            <span className="text-[11px] font-mono tracking-wide text-red-200">
              {syncError}
            </span>
            <button
              onClick={handleClearSyncError}
              className="ml-4 p-1 text-red-400 hover:text-white transition-colors"
              aria-label="Dismiss Error"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Add Goal Trigger Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black to-transparent py-6 flex justify-center pointer-events-none">
        <button
          onClick={handleAddTap}
          className="pointer-events-auto relative flex items-center justify-center gap-2 px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-md shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:bg-neutral-200 transition-all duration-300 hover:scale-105 active:scale-95 pulse-halo"
          aria-label={activeTab === "deadlines" ? "Add New Deadline" : activeTab === "habits" ? "Add New Habit" : "Add New Goal"}
        >
          <Plus size={16} strokeWidth={3} />
          <span>
            {activeTab === "deadlines"
              ? "New Deadline"
              : activeTab === "habits"
              ? "New Habit"
              : "New Goal"}
          </span>
        </button>
      </div>

      {/* Full Screen Sliding Modals */}
      {selectedGoalId && (
        <GoalDetailModal
          goalId={selectedGoalId}
          onClose={() => setSelectedGoalId(null)}
          onEditTap={handleModalEditTrigger}
        />
      )}

      {selectedHabitId && (() => {
        const habit = habits.find((h) => h.id === selectedHabitId);
        return habit ? (
          <HabitAnalyticsModal
            habit={habit}
            onClose={() => setSelectedHabitId(null)}
          />
        ) : null;
      })()}

      {isFormOpen && (
        (() => {
          if (activeTab === "habits" || editingHabit) {
            return (
              <HabitFormModal
                editHabit={editingHabit}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingHabit(null);
                }}
              />
            );
          }

          if (activeTab === "deadlines" || editingDeadline) {
            return (
              <DeadlineFormModal
                editDeadline={editingDeadline}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingDeadline(null);
                }}
              />
            );
          }

          return (
            <GoalFormModal
              editGoal={editingGoal}
              onClose={() => {
                setIsFormOpen(false);
                setEditingGoal(null);
              }}
            />
          );
        })()
      )}
    </div>
  );
}
