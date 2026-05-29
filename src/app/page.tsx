"use client";

import React, { useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
import { useGoalsStore } from "@/lib/store";
import { Goal } from "@/lib/types";
import AuthScreen from "@/components/AuthScreen";
import GoalCard from "@/components/GoalCard";
import GoalDetailModal from "@/components/GoalDetailModal";
import GoalFormModal from "@/components/GoalFormModal";
import AetherLogo from "@/components/AetherLogo";
import { LogOut, Plus, Search, Sparkles } from "lucide-react";
import ConstellationBackground from "@/components/ConstellationBackground";

export default function Home() {
  const { goals, loading, user, logout, reorderGoals, syncError, clearSyncError } = useGoalsStore();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isHeaderCompressed, setIsHeaderCompressed] = useState(false);

  const cardRectsRef = React.useRef<Record<string, DOMRect>>({});
  const prevGoalsRef = React.useRef<Goal[]>([]);
  const isReorderingRef = React.useRef(false);
  const tagsRef = React.useRef<HTMLDivElement>(null);

  // Get all unique tags for the horizontal tag filters (Memoized at top to avoid conditional hook early returns)
  const allTags = React.useMemo(() => {
    return Array.from(
      new Set(goals.flatMap((g) => g.tags))
    ).filter(Boolean);
  }, [goals]);

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
    const movedElements: Array<{ el: HTMLElement; deltaX: number; deltaY: number }> = [];

    // Step 1: Invert
    elements.forEach((el) => {
      const id = el.getAttribute("data-drag-id");
      if (!id) return;
      const firstRect = cardRectsRef.current[id];
      if (!firstRect) return;

      const lastRect = el.getBoundingClientRect();
      const deltaX = firstRect.left - lastRect.left;
      const deltaY = firstRect.top - lastRect.top;

      if (deltaX !== 0 || deltaY !== 0) {
        // Disable transitions and snap to the starting position immediately
        el.style.transition = "none";
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        movedElements.push({ el, deltaX, deltaY });
      }
    });

    // Step 2: Play (Force single layout reflow & animate back to native coordinates)
    if (movedElements.length > 0) {
      // Accessing offsetHeight on the first moved element triggers a forced layout reflow
      void movedElements[0].el.offsetHeight;

      requestAnimationFrame(() => {
        movedElements.forEach(({ el }) => {
          // Luxurious, spring-like cubic-bezier transition for smooth tactile swapping
          el.style.transition = "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)";
          el.style.transform = "translate(0px, 0px)";
        });

        // Step 3: Cleanup inline transition styles once animation ends
        setTimeout(() => {
          movedElements.forEach(({ el }) => {
            el.style.transition = "";
            el.style.transform = "";
          });
        }, 380);
      });
    }
  };

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

  // Authenticate Gate
  if (!user) {
    return <AuthScreen />;
  }

  // Handle Actions
  const handleCardTap = (goal: Goal) => {
    setSelectedGoalId(goal.id);
  };

  const handleEditTap = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleAddTap = () => {
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const handleModalEditTrigger = (goal: Goal) => {
    setSelectedGoalId(null);
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  // --- GOAL REORDER CONTROLS ---
  const canReorder = !searchQuery && !selectedTag;

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



  // Filtering
  const filteredGoals = goals.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = !selectedTag || g.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-black text-white md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 pb-28 relative flex flex-col overflow-hidden">
      <ConstellationBackground opacity={0.45} particleCount={100} />
      
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 mx-auto z-40 w-full md:max-w-md bg-black/80 backdrop-blur-md border-b transition-all duration-300 ease-out flex items-center justify-between ${
        isHeaderCompressed
          ? "py-3 px-6 border-neutral-800 shadow-[0_4px_30px_rgba(0,0,0,0.85)]"
          : "py-5 px-6 border-neutral-900/60 shadow-none"
      }`}>
        <div className={`flex items-center gap-2 select-none transition-transform duration-300 ease-out origin-left ${
          isHeaderCompressed ? "scale-[0.91]" : "scale-100"
        }`}>
          <div className="w-2.5 h-2.5 bg-white rounded-lg animate-pulse" />
          <AetherLogo />
        </div>

        <div className={`flex items-center gap-2.5 transition-transform duration-300 ease-out origin-right ${
          isHeaderCompressed ? "scale-[0.91]" : "scale-100"
        }`}>
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 hidden sm:inline-block mr-1.5">
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
        {/* Decorative Quote Panel */}
        <div className="flex items-center gap-3 p-4 border border-neutral-900 bg-neutral-950/40 rounded-lg select-none">
          <Sparkles size={16} className="text-neutral-400 shrink-0" />
          <p className="text-[10px] font-mono text-neutral-400 tracking-wide leading-relaxed">
            &quot;The secret of getting ahead is getting started.&quot; Use ↑↓ buttons on cards to reorder.
          </p>
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
        {allTags.length > 0 && (
          <div 
            ref={tagsRef}
            className="flex items-center gap-1.5 overflow-x-auto pb-2.5 -mx-6 px-6 touch-pan-x flex-nowrap shrink-0 pointer-events-auto select-none cursor-grab active:cursor-grabbing"
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono rounded-lg border transition-all ${
                !selectedTag
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-neutral-500 border-neutral-900 hover:text-neutral-300"
              }`}
            >
              All Goals
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono rounded-lg border transition-all shrink-0 ${
                  selectedTag === tag
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-neutral-500 border-neutral-900 hover:text-neutral-300"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Content Loading or Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase animate-pulse">
              Syncing Ledger
            </span>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
            <p className="text-xs text-neutral-500 font-light">
              No matching records found in this universe.
            </p>
            <button
              onClick={handleAddTap}
              className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-[10px] uppercase font-mono tracking-widest text-neutral-300 hover:text-white rounded-md transition-all"
            >
              Initialize Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredGoals.map((goal, idx) => (
              <div
                key={`${goal.id}-${selectedTag}`}
                data-drag-id={goal.id}
                className="animate-card-entrance"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <GoalCard
                  goal={goal}
                  onTap={handleCardTap}
                  onEditTap={handleEditTap}
                  onMoveUp={canReorder ? (e) => { e.stopPropagation(); handleMoveUp(idx); } : undefined}
                  onMoveDown={canReorder ? (e) => { e.stopPropagation(); handleMoveDown(idx); } : undefined}
                  isFirst={idx === 0}
                  isLast={idx === filteredGoals.length - 1}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Global Sync Error Banner */}
      {syncError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-full max-w-sm px-6 pointer-events-none">
          <div className="flex items-center justify-between p-4 bg-red-950/90 border border-red-900 rounded-lg shadow-2xl backdrop-blur-md pointer-events-auto">
            <span className="text-[11px] font-mono tracking-wide text-red-200">
              {syncError}
            </span>
            <button
              onClick={clearSyncError}
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
          className="pointer-events-auto flex items-center justify-center gap-2 px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-md shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:bg-neutral-200 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Add New Goal"
        >
          <Plus size={16} strokeWidth={3} />
          <span>New Goal</span>
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

      {isFormOpen && (
        <GoalFormModal
          editGoal={editingGoal}
          onClose={() => {
            setIsFormOpen(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
