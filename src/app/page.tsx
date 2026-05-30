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
  const [isTabDocked, setIsTabDocked] = useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const [prevTab, setPrevTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const progressRef = React.useRef(0);
  const dragDirectionRef = React.useRef<"undecided" | "horizontal" | "vertical">("undecided");
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const pillRef = React.useRef<HTMLDivElement>(null);
  const headerPillRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const activeTabRef = React.useRef(activeTab);
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  React.useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => {
      setTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const isTabCollapsed = (tab: "deadlines" | "goals" | "habits") => {
    if (isDraggingActive) return false;
    if (activeTab === tab) return false;
    if (transitioning && prevTab === tab) return false;
    return true;
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDraggingActive(true);
    progressRef.current = 0;
    dragDirectionRef.current = "undecided";
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStartPos.current) return;
    const diffX = dragStartPos.current.x - clientX;
    const viewportWidth = typeof window !== "undefined" ? Math.min(window.innerWidth, 448) : 448;
    let newProgress = -diffX / viewportWidth;
    
    const activeTabVal = activeTabRef.current;
    
    // Dampen if dragging out of bounds
    if (activeTabVal === "deadlines" && newProgress > 0) {
      newProgress = Math.pow(newProgress, 0.65) * 0.3;
    } else if (activeTabVal === "habits" && newProgress < 0) {
      newProgress = -Math.pow(Math.abs(newProgress), 0.65) * 0.3;
    }
    
    newProgress = Math.max(-1, Math.min(1, newProgress));
    progressRef.current = newProgress;

    // --- HIGH-PERFORMANCE DIRECT DOM TRANSFORMS ---
    // 1. Viewport Slider Track Layout Translation (Using absolute left keeps blurs and is extremely performant)
    if (trackRef.current) {
      const activeIndex = activeTabVal === "deadlines" ? 0 : activeTabVal === "goals" ? 1 : 2;
      const leftPx = -activeIndex * viewportWidth + (newProgress * viewportWidth);
      trackRef.current.style.left = `${leftPx}px`;
      trackRef.current.style.transition = "none";
    }

    // 2. Sliding Indicator Background (Top Pill)
    const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
    const currentIndex = tabIndices[activeTabVal];
    const baseLeft = currentIndex * 33.333;
    const baseRight = (2 - currentIndex) * 33.333;
    
    let currentLeft = baseLeft;
    let currentRight = baseRight;

    if (newProgress < 0) {
      // Swiping left (next tab)
      const lag = Math.pow(Math.abs(newProgress), 1.6) * -1;
      const lead = Math.pow(Math.abs(newProgress), 0.75) * -1;
      currentLeft = baseLeft - lag * 33.333;
      currentRight = baseRight + lead * 33.333;
    } else {
      // Swiping right (prev tab)
      const lead = Math.pow(newProgress, 0.75);
      const lag = Math.pow(newProgress, 1.6);
      currentLeft = baseLeft - lead * 33.333;
      currentRight = baseRight + lag * 33.333;
    }
    
    currentLeft = Math.max(0, Math.min(66.666, currentLeft));
    currentRight = Math.max(0, Math.min(66.666, currentRight));
    
    [pillRef.current, headerPillRef.current].forEach((pillEl) => {
      if (!pillEl) return;
      pillEl.style.left = `${currentLeft}%`;
      pillEl.style.right = `${currentRight}%`;
      pillEl.style.transition = "none";
      
      const innerPill = pillEl.querySelector('.bg-white') as HTMLElement;
      if (innerPill) {
        innerPill.style.transform = `scaleY(${1 - Math.abs(newProgress) * 0.12})`;
        innerPill.style.transition = "none";
      }
    });

    // 3. Dynamic Card Parallax, Scale, and Opacity Morphs
    const activeIndex = activeTabVal === "deadlines" ? 0 : activeTabVal === "goals" ? 1 : 2;
    const pages = ["deadlines", "goals", "habits"] as const;
    pages.forEach((tabName, idx) => {
      const pageEl = pageRefs.current[tabName];
      if (pageEl) {
        const d = (idx - activeIndex) + newProgress;
        const clampedD = Math.max(-1, Math.min(1, d));
        const absD = Math.abs(clampedD);
        
        if (absD < 1) {
          const scale = 1 - 0.08 * absD;
          const opacity = 1 - absD;
          const translateX = clampedD * -20; // Premium depth parallax translation
          
          pageEl.style.transform = `scale(${scale}) translateX(${translateX}px)`;
          pageEl.style.opacity = `${opacity}`;
          pageEl.style.transition = "none";
        } else {
          // Completely offscreen during drag
          pageEl.style.transform = `scale(0.92) translateX(${clampedD * -20}px)`;
          pageEl.style.opacity = "0";
          pageEl.style.transition = "none";
        }
      }
    });
  };

  const handleDragEnd = (clientX: number, clientY: number) => {
    if (!dragStartPos.current) return;
    setIsDraggingActive(false);
    
    const diffX = dragStartPos.current.x - clientX;
    const threshold = 50; 
    const activeTabVal = activeTabRef.current;
    let targetTab = activeTabVal;
    
    if (diffX > threshold) {
      if (activeTabVal === "deadlines") {
        targetTab = "goals";
      } else if (activeTabVal === "goals") {
        targetTab = "habits";
      }
    } else if (diffX < -threshold) {
      if (activeTabVal === "habits") {
        targetTab = "goals";
      } else if (activeTabVal === "goals") {
        targetTab = "deadlines";
      }
    }

    // Snap the track using layout left percentages (no GPU composites)
    if (trackRef.current) {
      const activeIndex = targetTab === "deadlines" ? 0 : targetTab === "goals" ? 1 : 2;
      trackRef.current.style.transition = "left 500ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      trackRef.current.style.left = `${-activeIndex * 100}%`;
    }

    const targetIndex = targetTab === "deadlines" ? 0 : targetTab === "goals" ? 1 : 2;
    [pillRef.current, headerPillRef.current].forEach((pillEl) => {
      if (!pillEl) return;
      pillEl.style.transition = "left 300ms cubic-bezier(0.34, 1.56, 0.64, 1), right 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      pillEl.style.left = `${targetIndex * 33.333}%`;
      pillEl.style.right = `${(2 - targetIndex) * 33.333}%`;
      
      const innerPill = pillEl.querySelector('.bg-white') as HTMLElement;
      if (innerPill) {
        innerPill.style.transition = "transform 300ms ease-out";
        innerPill.style.transform = "";
      }
    });

    // Snap target and inactive cards to their resting states
    const pages = ["deadlines", "goals", "habits"] as const;
    pages.forEach((tabName, idx) => {
      const pageEl = pageRefs.current[tabName];
      if (pageEl) {
        pageEl.style.transition = "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)";
        if (idx === targetIndex) {
          pageEl.style.transform = "scale(1) translateX(0px)";
          pageEl.style.opacity = "1";
        } else {
          const d = idx - targetIndex;
          pageEl.style.transform = `scale(0.92) translateX(${d * -20}px)`;
          pageEl.style.opacity = "0";
        }
      }
    });
    
    if (targetTab !== activeTabVal) {
      setPrevTab(activeTabVal);
      setActiveTab(targetTab);
    }
    
    dragStartPos.current = null;
    progressRef.current = 0;
  };

  const getTabStyle = (tab: "deadlines" | "goals" | "habits") => {
    const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
    const currentIndex = tabIndices[activeTab];
    const targetIndex = tabIndices[tab];
    const d = targetIndex - currentIndex;
    
    if (activeTab === tab) {
      return {
        opacity: 1,
        transform: "scale(1) translateX(0px)",
        transition: isDraggingActive ? "none" : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)"
      };
    }
    
    return {
      opacity: 0,
      transform: `scale(0.92) translateX(${d * -20}px)`,
      transition: isDraggingActive ? "none" : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)"
    };
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Skip page swipe when touching inside a bottom-sheet modal
      if (target.closest("[data-modal-sheet]")) return;
      if (target.closest(".touch-pan-x")) {
        return; // Skip page swipe capture when scrolling horizontally inside scroll containers
      }
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragStartPos.current) return;
      
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const diffX = dragStartPos.current.x - clientX;
      const diffY = dragStartPos.current.y - clientY;

      // Detect gesture intent on first significant movement
      if (dragDirectionRef.current === "undecided") {
        const threshold = 6;
        if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
          if (Math.abs(diffX) > Math.abs(diffY) * 1.1) {
            dragDirectionRef.current = "horizontal";
          } else {
            dragDirectionRef.current = "vertical";
            setIsDraggingActive(false); // Discard active drag state to allow smooth layout reset
          }
        }
      }

      if (dragDirectionRef.current === "horizontal") {
        e.preventDefault(); // Block horizontal browser swipe nav & vertical scrolling
        handleDragMove(clientX, clientY);
      }
      // If it's a vertical swipe, we do nothing and let the browser scroll the page natively!
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (dragStartPos.current) {
        if (dragDirectionRef.current === "horizontal") {
          handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        } else {
          // If vertical, just reset the dragging state cleanly
          setIsDraggingActive(false);
          dragStartPos.current = null;
          progressRef.current = 0;
        }
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const cardRectsRef = React.useRef<Record<string, DOMRect>>({});
  const prevGoalsRef = React.useRef<Goal[]>([]);
  const isReorderingRef = React.useRef(false);
  const tagsRef = React.useRef<HTMLDivElement>(null);
  // Track which card IDs have already played their entrance animation
  const introducedIdsRef = React.useRef<Set<string>>(new Set());

  // Get all unique tags, normalized case-insensitively and sorted alphabetically to avoid visual irregularity
  const allTags = React.useMemo(() => {
    const uniqueTags = new Set(
      goals
        .flatMap((g) => g.tags || [])
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    return Array.from(uniqueTags).sort();
  }, [goals]);

  const allHabitTags = React.useMemo(() => {
    const uniqueTags = new Set(
      habits
        .flatMap((h) => h.tags || [])
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    return Array.from(uniqueTags).sort();
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
      
      const matchesTag = !selectedTag || g.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

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
      const scrollY = window.scrollY;
      setIsHeaderCompressed(scrollY > 20);

      const sentinel = sentinelRef.current;
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        // Since the compressed header height is 56px, once rect.top <= 56, the tab docks.
        setIsTabDocked(rect.top <= 56);
      } else {
        // Fallback calculation based on scroll offset
        setIsTabDocked(scrollY > 110);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize immediately
    handleScroll();

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
      const matchesTag = !selectedTag || g.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

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

  const renderTabs = (isForHeader: boolean) => {
    const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
    const currentIndex = tabIndices[activeTab];
    const prevIndex = tabIndices[prevTab];
    const progress = progressRef.current;
    
    let leftStyle = `${currentIndex * 33.333}%`;
    let rightStyle = `${(2 - currentIndex) * 33.333}%`;
    let transitionStyle = currentIndex > prevIndex
      ? "right 320ms cubic-bezier(0.34, 1.8, 0.45, 1), left 380ms cubic-bezier(0.4, 0, 0.2, 1) 40ms"
      : currentIndex < prevIndex
        ? "left 320ms cubic-bezier(0.34, 1.8, 0.45, 1), right 380ms cubic-bezier(0.4, 0, 0.2, 1) 40ms"
        : "left 300ms ease-out, right 300ms ease-out";
        
    if (isDraggingActive) {
      const baseLeft = currentIndex * 33.333;
      const baseRight = (2 - currentIndex) * 33.333;
      
      let currentLeft = baseLeft;
      let currentRight = baseRight;

      if (progress < 0) {
        // Swiping left (next tab)
        const lag = Math.pow(Math.abs(progress), 1.6) * -1;
        const lead = Math.pow(Math.abs(progress), 0.75) * -1;
        currentLeft = baseLeft - lag * 33.333;
        currentRight = baseRight + lead * 33.333;
      } else {
        // Swiping right (prev tab)
        const lead = Math.pow(progress, 0.75);
        const lag = Math.pow(progress, 1.6);
        currentLeft = baseLeft - lead * 33.333;
        currentRight = baseRight + lag * 33.333;
      }
      
      currentLeft = Math.max(0, Math.min(66.666, currentLeft));
      currentRight = Math.max(0, Math.min(66.666, currentRight));
      
      leftStyle = `${currentLeft}%`;
      rightStyle = `${currentRight}%`;
      transitionStyle = "none";
    }
    
    return (
      <div className="relative flex w-full h-full select-none">
        {/* Sliding Indicator Background */}
        <div 
          ref={isForHeader ? headerPillRef : pillRef}
          className="absolute inset-y-0"
          style={{
            left: leftStyle,
            right: rightStyle,
            transition: transitionStyle
          }}
        >
          <div className="w-full h-full p-1">
            <div 
              className="w-full h-full bg-white rounded-lg shadow-md origin-center transition-transform duration-100 ease-out" 
              style={{
                transform: isDraggingActive 
                  ? `scaleY(${1 - Math.abs(progress) * 0.12})` 
                  : undefined
              }}
            />
          </div>
        </div>

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
    );
  };

  const syncError = goalsSyncError || habitsSyncError;
  const handleClearSyncError = () => {
    if (goalsSyncError) clearGoalsSyncError();
    if (habitsSyncError) clearHabitsSyncError();
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen text-white md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 pb-28 relative flex flex-col"
      style={{ zIndex: 1 }}
    >
      <ConstellationBackground opacity={0.75} particleCount={150} />
      
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 mx-auto z-40 w-full md:max-w-md bg-[#0d0d0d]/80 backdrop-blur-md transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden ${
        isTabDocked
          ? "h-24 border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.9)]"
          : isHeaderCompressed
            ? "h-14 border-b border-transparent shadow-none"
            : "h-[76px] border-b border-neutral-900/60 shadow-none"
      }`}>
        <div className={`w-full flex items-center justify-between px-6 select-none transition-all duration-300 ${
          isHeaderCompressed || isTabDocked ? "h-14" : "h-[76px]"
        }`}>
          <div className={`flex items-center gap-2 select-none transition-transform duration-300 ease-out origin-left ${
            isHeaderCompressed || isTabDocked ? "scale-[0.91]" : "scale-100"
          }`}>
            <div className="w-2 h-2 rounded-full animate-breath-cyan-green" />
            <AetherLogo />
          </div>

          <div className={`flex items-center gap-2.5 transition-transform duration-300 ease-out origin-right ${
            isHeaderCompressed || isTabDocked ? "scale-[0.91]" : "scale-100"
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
        </div>

        {/* Nested Tabs inside the Header for seamless blur */}
        <div className={`px-6 pb-2 w-full transition-all duration-300 ease-out ${
          isTabDocked ? "opacity-100 translate-y-0 h-10 visible" : "opacity-0 -translate-y-2 h-0 invisible pointer-events-none"
        }`}>
          {renderTabs(true)}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-6 pt-24 pb-6 space-y-6">
        {/* Sentinel to detect when tab hits header */}
        <div ref={sentinelRef} className="h-[1px] w-full pointer-events-none -mb-[1px]" />

        {/* Navigation Tabs (Deadlines, Goals, Habits) with Morphing Pill Switcher */}
        <div 
          className={`sticky top-[55px] z-30 flex select-none shrink-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            isTabDocked
              ? "opacity-0 pointer-events-none scale-[0.96]"
              : "opacity-100 scale-100 rounded-xl border border-neutral-900 bg-neutral-950 p-1 w-full"
          }`}
          style={{ marginTop: 0 }}
        >
          {renderTabs(false)}
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
            className="flex items-center gap-2 overflow-x-auto pb-3 -mx-6 px-6 touch-pan-x flex-nowrap shrink-0 pointer-events-auto select-none cursor-grab active:cursor-grabbing scrollbar-none"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`py-1.5 px-3.5 text-[9px] uppercase tracking-widest font-mono rounded-full border transition-all duration-300 active:scale-95 shrink-0 ${
                !selectedTag
                  ? "bg-white text-black border-transparent shadow-[0_0_12px_rgba(255,255,255,0.15)] font-bold scale-102"
                  : "bg-neutral-950/30 text-neutral-400 border-neutral-900/60 backdrop-blur-md hover:text-white hover:border-neutral-800 hover:bg-neutral-950/60"
              }`}
            >
              {activeTab === "habits" ? "All Habits" : activeTab === "deadlines" ? "All Deadlines" : "All Goals"}
            </button>
            {tagsToDisplay.map((tag) => {
              const isActive = selectedTag?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isActive ? null : tag)}
                  className={`py-1.5 px-3.5 text-[9px] uppercase tracking-widest font-mono rounded-full border transition-all duration-300 shrink-0 flex items-center gap-0.5 active:scale-95 ${
                    isActive
                      ? "bg-white text-black border-transparent shadow-[0_0_12px_rgba(255,255,255,0.15)] font-bold scale-102"
                      : "bg-neutral-950/30 text-neutral-400 border-neutral-900/60 backdrop-blur-md hover:text-white hover:border-neutral-800 hover:bg-neutral-950/60"
                  }`}
                >
                  <span className={isActive ? "text-neutral-500 font-extrabold" : "text-cyan-400/80 font-bold"}>#</span>
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Viewport Slider Track */}
        <div className="w-full overflow-hidden py-2 -my-2 relative">
          <div 
            ref={trackRef}
            className="flex w-[300%] relative"
            style={{
              left: (() => {
                const activeIndex = activeTab === "deadlines" ? 0 : activeTab === "goals" ? 1 : 2;
                return `${-activeIndex * 100}%`;
              })(),
              transition: isDraggingActive 
                ? "none" 
                : "left 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          >
            {/* Page 1: Deadlines */}
            <div 
              ref={(el) => { pageRefs.current["deadlines"] = el; }}
              className={`w-1/3 shrink-0 ${isTabCollapsed("deadlines") ? "h-0 overflow-hidden" : ""}`}
              style={getTabStyle("deadlines")}
            >
              {renderPageContent("deadlines")}
            </div>

            {/* Page 2: Goals */}
            <div 
              ref={(el) => { pageRefs.current["goals"] = el; }}
              className={`w-1/3 shrink-0 ${isTabCollapsed("goals") ? "h-0 overflow-hidden" : ""}`}
              style={getTabStyle("goals")}
            >
              {renderPageContent("goals")}
            </div>

            {/* Page 3: Habits */}
            <div 
              ref={(el) => { pageRefs.current["habits"] = el; }}
              className={`w-1/3 shrink-0 ${isTabCollapsed("habits") ? "h-0 overflow-hidden" : ""}`}
              style={getTabStyle("habits")}
            >
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
