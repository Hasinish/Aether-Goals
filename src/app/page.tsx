"use client";

import React, { useState } from "react";
import { useGoalsStore } from "@/lib/store";
import { Goal } from "@/lib/types";
import AuthScreen from "@/components/AuthScreen";
import GoalCard from "@/components/GoalCard";
import GoalDetailModal from "@/components/GoalDetailModal";
import GoalFormModal from "@/components/GoalFormModal";
import { LogOut, Plus, Search, Sparkles } from "lucide-react";

export default function Home() {
  const { goals, loading, user, logout, reorderGoals } = useGoalsStore();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [draggedGoalIndex, setDraggedGoalIndex] = useState<number | null>(null);

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

  // --- DRAG AND DROP GOAL REORDER ---
  const canDragSort = !searchQuery && !selectedTag;

  const handleDragStart = (idx: number) => {
    setDraggedGoalIndex(idx);
  };

  const handleDragEnter = (targetIdx: number) => {
    if (draggedGoalIndex === null || draggedGoalIndex === targetIdx) return;
    reorderGoals(draggedGoalIndex, targetIdx);
    setDraggedGoalIndex(targetIdx);
  };

  const handleDragEnd = () => {
    setDraggedGoalIndex(null);
  };

  // Get all unique tags for the horizontal tag filters
  const allTags = Array.from(
    new Set(goals.flatMap((g) => g.tags))
  ).filter(Boolean);

  // Filtering
  const filteredGoals = goals.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = !selectedTag || g.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-black text-white md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 pb-28 relative flex flex-col">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-900 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
          <h1 className="text-xl font-black tracking-tighter uppercase">Aether</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 hidden sm:inline-block">
            {user === "guest" ? "Guest Sandbox" : user.email?.split("@")[0]}
          </span>
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
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Decorative Quote Panel */}
        <div className="flex items-center gap-3 p-4 border border-neutral-900 bg-neutral-950/40 rounded-2xl select-none">
          <Sparkles size={16} className="text-neutral-400 shrink-0" />
          <p className="text-[10px] font-mono text-neutral-400 tracking-wide leading-relaxed">
            &quot;The secret of getting ahead is getting started.&quot; Drag cards to sort dashboard goals.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals or tags..."
            className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-850 border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
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
            <div className="w-8 h-8 border-2 border-neutral-850 border-t-white rounded-full animate-spin" />
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase animate-pulse">
              Syncing Ledger
            </span>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-2xl select-none space-y-3">
            <p className="text-xs text-neutral-500 font-light">
              No matching records found in this universe.
            </p>
            <button
              onClick={handleAddTap}
              className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-[10px] uppercase font-mono tracking-widest text-neutral-300 hover:text-white rounded-xl transition-all"
            >
              Initialize Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredGoals.map((goal, idx) => (
              <div
                key={goal.id}
                draggable={canDragSort}
                onDragStart={() => canDragSort && handleDragStart(idx)}
                onDragEnter={() => canDragSort && handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => canDragSort && e.preventDefault()}
                className={`transition-all duration-200 select-none ${
                  draggedGoalIndex === idx
                    ? "opacity-35 scale-[0.98] border border-dashed border-neutral-700 rounded-2xl"
                    : "opacity-100 scale-100"
                }`}
              >
                <GoalCard
                  goal={goal}
                  onTap={handleCardTap}
                  onEditTap={handleEditTap}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Add Goal Trigger Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black to-transparent py-6 flex justify-center pointer-events-none">
        <button
          onClick={handleAddTap}
          className="pointer-events-auto flex items-center justify-center gap-2 px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:bg-neutral-200 transition-all duration-300 hover:scale-105 active:scale-95"
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
