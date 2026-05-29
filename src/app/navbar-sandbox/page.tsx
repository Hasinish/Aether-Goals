"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Calendar, 
  Target, 
  Repeat, 
  Sliders, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  CheckSquare,
  Sparkle,
  Clock,
  Briefcase
} from "lucide-react";
import ConstellationBackground from "@/components/ConstellationBackground";

// --- Mock Device Showcase Component with self-contained Database and modal sheet ---
interface InteractiveDeviceProps {
  title: string;
  description: string;
  navBarType: "radial-carousel" | "apple-dock" | "gooey-tab" | "global-fab-dock" | "neon-sweep" | "magnetic-pill" | "corner-radial" | "mechanical-key" | "text-icon-morph" | "minimalist-dot";
}

const InteractiveDeviceMockup = ({ title, description, navBarType }: InteractiveDeviceProps) => {
  const [activeTab, setActiveTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"deadline" | "goal" | "habit">("goal");
  const [titleInput, setTitleInput] = useState("");
  
  // Custom mock data lists per mockup device
  const [deadlines, setDeadlines] = useState([
    { id: "d1", title: "Product Launch V2", duration: "In 3 Days", desc: "Compile deployment assets" },
    { id: "d2", title: "Security Audit Ledger", duration: "June 15", desc: "Verify cryptographic locks" }
  ]);
  const [goals, setGoals] = useState([
    { id: "g1", title: "Aether Design Sandbox", progress: 75 },
    { id: "g2", title: "Synthesize Engines", progress: 40 }
  ]);
  const [habits, setHabits] = useState([
    { id: "h1", title: "Write Cleaner Code", streak: 18, checked: true },
    { id: "h2", title: "Morning Reflection", streak: 4, checked: false }
  ]);

  // Swipe gesture variables
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Expanded status for expandable FABs
  const [isFabExpanded, setIsFabExpanded] = useState(false);

  // Trigger Contextual Add
  const handleContextualAdd = () => {
    if (activeTab === "deadlines") setDrawerType("deadline");
    else if (activeTab === "habits") setDrawerType("habit");
    else setDrawerType("goal");
    setIsDrawerOpen(true);
  };

  // Trigger Global Add Menu selection
  const handleGlobalAdd = (type: "deadline" | "goal" | "habit") => {
    setDrawerType(type);
    setIsDrawerOpen(true);
    setIsFabExpanded(false);
  };

  // Form submission
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = titleInput.trim();
    if (!trimmed) return;

    if (drawerType === "deadline") {
      setDeadlines([
        ...deadlines, 
        { id: Date.now().toString(), title: trimmed, duration: "Just now", desc: "Custom deadline entry" }
      ]);
      setActiveTab("deadlines");
    } else if (drawerType === "goal") {
      setGoals([
        ...goals, 
        { id: Date.now().toString(), title: trimmed, progress: 0 }
      ]);
      setActiveTab("goals");
    } else if (drawerType === "habit") {
      setHabits([
        ...habits, 
        { id: Date.now().toString(), title: trimmed, streak: 0, checked: false }
      ]);
      setActiveTab("habits");
    }

    setTitleInput("");
    setIsDrawerOpen(false);
  };

  // Toggle habit check state
  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, checked: !h.checked, streak: h.checked ? h.streak - 1 : h.streak + 1 } : h));
  };

  // Touch Swipe Handlers for Device Body
  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStartPos({ x: clientX, y: clientY });
  };

  const handleDragEnd = (clientX: number, clientY: number) => {
    if (!dragStartPos) return;
    const diffX = dragStartPos.x - clientX;
    const diffY = dragStartPos.y - clientY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        if (activeTab === "deadlines") setActiveTab("goals");
        else if (activeTab === "goals") setActiveTab("habits");
      } else {
        if (activeTab === "habits") setActiveTab("goals");
        else if (activeTab === "goals") setActiveTab("deadlines");
      }
    }
    setDragStartPos(null);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-[#0c0c0c]/85 border border-neutral-900 rounded-2xl shadow-xl space-y-4 backdrop-blur-md relative overflow-visible group">
      
      {/* Description Info Header */}
      <div className="w-full text-left">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></span>
            {title}
          </h3>
          <span className="text-[7px] font-mono uppercase px-2 py-0.5 border border-neutral-800 bg-neutral-950 text-neutral-400 rounded-md">
            {navBarType === "global-fab-dock" || navBarType === "corner-radial" ? "Global Add Flow" : "Contextual Add Flow"}
          </span>
        </div>
        <p className="text-[11px] text-neutral-450 mt-1 font-light leading-relaxed min-h-[32px]">
          {description}
        </p>
      </div>

      {/* Mock Mobile Viewport Screen */}
      <div 
        className="relative w-full max-w-[280px] h-[460px] bg-black border border-neutral-850 rounded-[28px] overflow-hidden flex flex-col justify-between shadow-[0_24px_50px_rgba(0,0,0,0.8)]"
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
      >
        {/* Mock Status Bar */}
        <div className="w-full h-8 px-5 pt-2 flex items-center justify-between bg-black text-[9px] font-mono text-neutral-500 select-none z-30 shrink-0">
          <span>23:02</span>
          <div className="w-10 h-3.5 bg-neutral-900 rounded-full border border-neutral-800 flex items-center justify-center text-[7px] text-neutral-400">
            AETHER OS
          </div>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-3 h-1.5 border border-neutral-600 rounded-2xs p-[1px] flex justify-start items-center">
              <div className="w-2 h-full bg-neutral-400 rounded-3xs"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 w-full relative flex flex-col overflow-hidden bg-[#040404] select-none">
          {activeTab === "deadlines" && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto animate-fade-in pb-16">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Timeline Deadlines</h4>
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-red-950/60 border border-red-900/60 text-red-400 font-mono">
                  {deadlines.length} Active
                </span>
              </div>
              
              <div className="space-y-2">
                {deadlines.map(d => (
                  <div key={d.id} className="p-3 bg-neutral-900/60 border border-red-900/10 rounded-xl space-y-1 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-white leading-tight">{d.title}</span>
                      <span className="text-[7.5px] font-mono text-red-400 uppercase tracking-wider shrink-0 ml-2">{d.duration}</span>
                    </div>
                    <p className="text-[9px] text-neutral-400 font-light">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "habits" && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto animate-fade-in pb-16">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Daily Habits</h4>
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 font-mono">
                  {habits.filter(h => h.checked).length}/{habits.length} Complete
                </span>
              </div>
              
              <div className="space-y-2">
                {habits.map(h => (
                  <div 
                    key={h.id} 
                    onClick={() => toggleHabit(h.id)}
                    className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-neutral-900 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-white leading-tight">{h.title}</span>
                      <div className="flex gap-1 text-[7px] font-mono text-emerald-400 uppercase tracking-widest">
                        <span>🔥 {h.streak} Day Streak</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center font-bold text-[9px] transition-all ${
                      h.checked 
                        ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                        : "border-neutral-700 text-transparent"
                    }`}>
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto animate-fade-in pb-16">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Core Goals</h4>
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-900/60 text-cyan-400 font-mono">
                  {goals.length} Active
                </span>
              </div>
              
              <div className="space-y-2">
                {goals.map(g => (
                  <div key={g.id} className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl space-y-2 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-white leading-tight">{g.title}</span>
                      <span className="text-[9px] font-bold text-cyan-400 shrink-0 ml-2">{g.progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Sliding Modal sheet (Within Mock Device Viewport) */}
          <div 
            className={`absolute inset-x-0 bottom-0 bg-[#0c0c0c] border-t border-neutral-800 rounded-t-2xl z-50 p-4 transition-transform duration-350 ease-out select-none flex flex-col justify-between ${
              isDrawerOpen ? "translate-y-0 shadow-[0_-8px_24px_rgba(0,0,0,0.8)]" : "translate-y-full"
            }`}
            style={{ height: "180px" }}
          >
            <form onSubmit={handleCreateItem} className="flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                    Add New {drawerType}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => { setIsDrawerOpen(false); setTitleInput(""); }}
                    className="text-[9px] font-mono text-neutral-500 hover:text-white uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={`Enter ${drawerType} title...`}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-[11px] px-3 py-2 rounded-xl text-white focus:outline-none focus:border-neutral-650"
                  autoFocus={isDrawerOpen}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-white text-black hover:bg-neutral-250 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-98 mt-2"
              >
                Create Entry
              </button>
            </form>
          </div>
        </div>

        {/* --- NAVIGATION BARS RENDER BLOCK --- */}

        {/* 1. radial-carousel */}
        {navBarType === "radial-carousel" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div 
              className="pointer-events-auto flex items-center justify-center w-[88%] h-14 bg-[#0a0a0a]/95 border border-white/10 backdrop-blur-xl rounded-full shadow-2xl overflow-hidden relative select-none"
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
              onMouseUp={(e) => handleDragEnd(e.clientX, e.clientY)}
              onMouseLeave={() => setDragStartPos(null)}
            >
              <div className="absolute inset-y-0 w-12 left-1/2 -translate-x-1/2 bg-white/[0.02] border-x border-white/5 pointer-events-none rounded-md" />
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />

              <div 
                className="flex items-center gap-5 transition-transform duration-300 ease-out"
                style={{
                  transform: 
                    activeTab === "deadlines"
                      ? "translateX(112px)"
                      : activeTab === "habits"
                        ? "translateX(-112px)"
                        : "translateX(0px)"
                }}
              >
                {[
                  { id: "deadlines" as const, label: "Deadlines", icon: Calendar },
                  { id: "goals" as const, label: "Goals", icon: Target },
                  { id: "habits" as const, label: "Habits", icon: Repeat }
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="w-24 h-12 flex items-center justify-center shrink-0">
                      <button
                        onClick={() => {
                          if (isActive) handleContextualAdd();
                          else setActiveTab(item.id);
                        }}
                        className={`relative flex flex-col items-center justify-center transition-all duration-300 ease-out ${
                          isActive
                            ? "w-11 h-11 bg-white text-black rounded-lg shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 pulse-halo"
                            : "w-24 h-12 bg-transparent text-neutral-500 hover:text-neutral-350 gap-0.5 scale-90"
                        }`}
                      >
                        <span className={`absolute transition-all duration-300 ${isActive ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90 pointer-events-none"}`}>
                          <Plus size={16} strokeWidth={3} />
                        </span>
                        <div className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"}`}>
                          <Icon size={13} />
                          <span className="text-[7.5px] font-bold uppercase tracking-wider font-mono">{item.label}</span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. apple-dock */}
        {navBarType === "apple-dock" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between w-[90%] h-14 bg-neutral-950/80 border border-neutral-900 backdrop-blur-lg rounded-2xl px-2 shadow-2xl relative select-none">
              <div 
                className="absolute h-9 w-[78px] bg-white/5 border border-white/10 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  left: 
                    activeTab === "deadlines"
                      ? "10px"
                      : activeTab === "goals"
                        ? "50% - 39px"
                        : "auto",
                  right: activeTab === "habits" ? "10px" : "auto",
                  transform: activeTab === "goals" ? "translateX(-50%)" : "none",
                  marginLeft: activeTab === "goals" ? "50%" : "0px"
                }}
              />

              {[
                { id: "deadlines" as const, label: "Deadlines", icon: Calendar },
                { id: "goals" as const, label: "Goals", icon: Target },
                { id: "habits" as const, label: "Habits", icon: Repeat }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isActive) handleContextualAdd();
                      else setActiveTab(item.id);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center h-10 transition-all duration-350 relative ${
                      isActive 
                        ? "-translate-y-1.5 text-white scale-105 font-bold" 
                        : "text-neutral-500 hover:text-neutral-350 scale-95"
                    }`}
                  >
                    {isActive ? (
                      <div className="w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform pulse-halo">
                        <Plus size={15} strokeWidth={3} />
                      </div>
                    ) : (
                      <>
                        <Icon size={14} />
                        <span className="text-[7px] font-mono uppercase tracking-widest mt-0.5">{item.label}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. gooey-tab */}
        {navBarType === "gooey-tab" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div 
              style={{ filter: "url(#gooey-filter)" }}
              className="pointer-events-auto flex items-center justify-between w-[90%] h-14 bg-neutral-950 border border-neutral-900/60 rounded-full px-3 shadow-2xl relative select-none"
            >
              <div 
                className="absolute w-11 h-9 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-400 ease-[cubic-bezier(0.77,0,0.175,1)]"
                style={{
                  left: 
                    activeTab === "deadlines"
                      ? "22px"
                      : activeTab === "goals"
                        ? "50%"
                        : "auto",
                  right: activeTab === "habits" ? "22px" : "auto",
                  transform: activeTab === "goals" ? "translateX(-50%)" : "none",
                  marginLeft: activeTab === "goals" ? "50%" : "0px"
                }}
              />

              {[
                { id: "deadlines" as const, label: "Deadlines", icon: Calendar },
                { id: "goals" as const, label: "Goals", icon: Target },
                { id: "habits" as const, label: "Habits", icon: Repeat }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isActive) handleContextualAdd();
                      else setActiveTab(item.id);
                    }}
                    className="flex-1 flex flex-col items-center justify-center h-12 relative z-10 transition-colors duration-300"
                  >
                    <div className={`transition-transform duration-300 ${isActive ? "text-black scale-110" : "text-neutral-450 hover:text-white"}`}>
                      {isActive ? <Plus size={15} strokeWidth={3.5} /> : <Icon size={15} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. global-fab-dock */}
        {navBarType === "global-fab-dock" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            
            {/* Global Quick Action Fan Drawer Overlay (Floating inside viewport screen) */}
            {isFabExpanded && (
              <div className="absolute bottom-16 bg-[#0a0a0a]/95 border border-neutral-850 p-2.5 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.9)] w-[85%] max-w-[240px] pointer-events-auto flex flex-col gap-1.5 animate-slide-up">
                <div className="text-[7.5px] font-mono uppercase tracking-widest text-neutral-500 px-2 pb-1 border-b border-neutral-900">
                  Global Create Node
                </div>
                {[
                  { label: "Add Deadline", type: "deadline" as const, icon: Calendar, text: "text-red-400 hover:bg-red-950/20" },
                  { label: "Add Goal", type: "goal" as const, icon: Target, text: "text-cyan-400 hover:bg-cyan-950/20" },
                  { label: "Add Habit", type: "habit" as const, icon: Repeat, text: "text-emerald-400 hover:bg-emerald-950/20" }
                ].map((act) => (
                  <button
                    key={act.type}
                    onClick={() => handleGlobalAdd(act.type)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[9px] font-mono uppercase font-semibold transition-colors ${act.text}`}
                  >
                    <span className="flex items-center gap-2">
                      <act.icon size={11} />
                      {act.label}
                    </span>
                    <Plus size={10} />
                  </button>
                ))}
              </div>
            )}

            <div className="pointer-events-auto flex items-center justify-between w-[90%] h-14 bg-neutral-950/90 border border-neutral-900 rounded-full px-4 shadow-2xl relative select-none">
              <button 
                onClick={() => setActiveTab("deadlines")} 
                className={`flex-1 flex flex-col items-center justify-center text-[7px] font-mono tracking-widest ${
                  activeTab === "deadlines" ? "text-cyan-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Calendar size={14} />
                <span className="mt-0.5">DEAD</span>
              </button>

              {/* Central Plus Menu Action Trigger */}
              <button
                onClick={() => setIsFabExpanded(!isFabExpanded)}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 ${
                  isFabExpanded 
                    ? "bg-neutral-800 text-white rotate-45 border border-neutral-700" 
                    : "bg-white text-black border border-white/20 pulse-halo"
                }`}
                title="Create Operations"
              >
                <Plus size={16} strokeWidth={3} />
              </button>

              <button 
                onClick={() => setActiveTab("habits")} 
                className={`flex-1 flex flex-col items-center justify-center text-[7px] font-mono tracking-widest ${
                  activeTab === "habits" ? "text-cyan-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Repeat size={14} />
                <span className="mt-0.5">HABT</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. neon-sweep */}
        {navBarType === "neon-sweep" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-around w-[90%] h-14 bg-[#080808]/95 border border-neutral-900 rounded-2xl shadow-xl select-none">
              {[
                { id: "deadlines" as const, icon: Calendar },
                { id: "goals" as const, icon: Target },
                { id: "habits" as const, icon: Repeat }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isActive) handleContextualAdd();
                      else setActiveTab(item.id);
                    }}
                    className={`relative p-2.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? "bg-white text-black scale-105 shadow-2xl" 
                        : "text-neutral-500 hover:text-neutral-350 scale-95"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-full border border-cyan-400 animate-breath-cyan-green pointer-events-none scale-125 opacity-75"></div>
                    )}
                    {isActive ? <Plus size={15} strokeWidth={3} /> : <Icon size={15} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. magnetic-pill */}
        {navBarType === "magnetic-pill" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between w-[92%] h-14 bg-neutral-950/80 border border-white/5 backdrop-blur-xl rounded-full px-2 shadow-2xl relative select-none">
              <div 
                className="absolute h-10 w-[72px] bg-white text-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-md"
                style={{
                  left: 
                    activeTab === "deadlines"
                      ? "10px"
                      : activeTab === "goals"
                        ? "50% - 36px"
                        : "auto",
                  right: activeTab === "habits" ? "10px" : "auto",
                  transform: activeTab === "goals" ? "translateX(-50%)" : "none",
                  marginLeft: activeTab === "goals" ? "50%" : "0px"
                }}
              />

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
                      if (isActive) handleContextualAdd();
                      else setActiveTab(item.id);
                    }}
                    className={`flex-1 text-[8px] font-mono font-bold uppercase tracking-wider h-10 flex items-center justify-center relative z-10 transition-colors duration-200 ${
                      isActive ? "text-black" : "text-neutral-500 hover:text-neutral-350"
                    }`}
                  >
                    {isActive ? "+" : item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. corner-radial */}
        {navBarType === "corner-radial" && (
          <div className="absolute bottom-3 right-3 z-40 flex flex-col items-end pointer-events-none select-none">
            
            {/* Expanded Fan Buttons */}
            {isFabExpanded && (
              <div className="flex flex-col gap-2 mb-3 items-end pointer-events-auto animate-slide-up">
                {[
                  { id: "deadlines" as const, type: "deadline" as const, label: "New Deadline", icon: Calendar, bg: "bg-red-950/90 border-red-800 text-red-400 hover:bg-red-950/60" },
                  { id: "goals" as const, type: "goal" as const, label: "New Goal", icon: Target, bg: "bg-cyan-950/90 border-cyan-800 text-cyan-400 hover:bg-cyan-950/60" },
                  { id: "habits" as const, type: "habit" as const, label: "New Habit", icon: Repeat, bg: "bg-emerald-950/90 border-emerald-800 text-emerald-400 hover:bg-emerald-950/60" }
                ].map((act) => (
                  <button
                    key={act.type}
                    onClick={() => handleGlobalAdd(act.type)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 border rounded-xl backdrop-blur-md transition-all hover:scale-103 active:scale-97 text-[8px] font-mono uppercase font-bold tracking-widest ${act.bg}`}
                  >
                    <act.icon size={11} />
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Row Navigation + Anchored Dial */}
            <div className="pointer-events-auto flex items-center gap-2">
              {/* Tab Selector Links */}
              <div className="flex items-center gap-1 p-1 bg-[#0a0a0a]/90 border border-neutral-900 rounded-xl shadow-lg backdrop-blur-md">
                {[
                  { id: "deadlines" as const, icon: Calendar },
                  { id: "goals" as const, icon: Target },
                  { id: "habits" as const, icon: Repeat }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-2 rounded-lg transition-all ${activeTab === item.id ? "bg-white text-black" : "text-neutral-500 hover:text-neutral-350"}`}
                  >
                    <item.icon size={12} />
                  </button>
                ))}
              </div>

              {/* Fan Anchor Trigger */}
              <button
                onClick={() => setIsFabExpanded(!isFabExpanded)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border shadow-2xl ${
                  isFabExpanded 
                    ? "bg-neutral-850 border-neutral-700 text-white rotate-45" 
                    : "bg-white border-white/20 text-black pulse-halo"
                }`}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* 8. mechanical-key */}
        {navBarType === "mechanical-key" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex w-[90%] h-14 bg-neutral-950 border border-neutral-900 rounded-xl p-1 shadow-inner relative select-none gap-1">
              {[
                { id: "deadlines" as const, label: "DEAD", icon: Calendar },
                { id: "goals" as const, label: "GOAL", icon: Target },
                { id: "habits" as const, label: "HABT", icon: Repeat }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isActive) handleContextualAdd();
                      else setActiveTab(item.id);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center rounded-lg transition-all duration-150 relative ${
                      isActive 
                        ? "bg-[#060606] shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] border border-neutral-900 border-b-transparent text-white pt-1" 
                        : "bg-neutral-900/60 border border-neutral-850 hover:bg-neutral-900 text-neutral-500 hover:text-neutral-350"
                    }`}
                  >
                    {isActive ? (
                      <div className="flex flex-col items-center">
                        <Plus size={13} strokeWidth={3} className="text-cyan-400" />
                        <div className="w-5 h-0.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4] mt-1 rounded-full"></div>
                      </div>
                    ) : (
                      <>
                        <Icon size={12} />
                        <span className="text-[6.5px] font-mono uppercase tracking-widest mt-0.5">{item.label}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 9. text-icon-morph */}
        {navBarType === "text-icon-morph" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between w-[92%] h-14 bg-[#0a0a0a]/90 border border-neutral-850 backdrop-blur-md rounded-2xl px-2 shadow-2xl relative select-none">
              {[
                { id: "deadlines" as const, label: "Deadlines", icon: Calendar },
                { id: "goals" as const, label: "Goals", icon: Target },
                { id: "habits" as const, label: "Habits", icon: Repeat }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex-1 flex justify-center items-center">
                    <button
                      onClick={() => {
                        if (isActive) handleContextualAdd();
                        else setActiveTab(item.id);
                      }}
                      className={`relative flex items-center justify-center transition-all duration-300 ease-out ${
                        isActive
                          ? "w-9 h-9 bg-white text-black rounded-lg shadow-lg hover:scale-105 active:scale-95 pulse-halo"
                          : "w-18 h-9 bg-transparent text-neutral-500 hover:text-neutral-350 flex-col gap-0.5"
                      }`}
                    >
                      <span className={`absolute transition-all duration-300 ${isActive ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90 pointer-events-none"}`}>
                        <Plus size={15} strokeWidth={3} />
                      </span>
                      <div className={`flex flex-col items-center transition-all duration-300 ${isActive ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"}`}>
                        <Icon size={13} />
                        <span className="text-[7px] font-mono uppercase tracking-widest mt-0.5">{item.label}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. minimalist-dot */}
        {navBarType === "minimalist-dot" && (
          <div className="absolute bottom-3 left-0 right-0 z-40 flex justify-center py-2 px-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-around w-[90%] h-14 bg-black/60 border border-neutral-900 backdrop-blur-md rounded-2xl shadow-xl select-none">
              {[
                { id: "deadlines" as const, icon: Calendar },
                { id: "goals" as const, icon: Target },
                { id: "habits" as const, icon: Repeat }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isActive) handleContextualAdd();
                      else setActiveTab(item.id);
                    }}
                    className="flex flex-col items-center justify-center p-2 relative group w-12 h-10"
                  >
                    <div className={`transition-all duration-300 ${
                      isActive 
                        ? "text-cyan-400 scale-110 -translate-y-1" 
                        : "text-neutral-500 hover:text-neutral-350 scale-95"
                    }`}>
                      {isActive ? <Plus size={15} strokeWidth={3} /> : <Icon size={15} />}
                    </div>

                    <div className={`absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] transition-all duration-300 ${
                      isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default function NavbarSandbox() {
  return (
    <div className="min-h-screen bg-black text-white pb-32 relative flex flex-col overflow-hidden">
      <ConstellationBackground opacity={0.35} particleCount={150} />

      {/* SVG Gooey Filter definitions for Tab Style 3 */}
      <svg className="hidden">
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Laboratory Title Header */}
      <header className="py-12 px-6 max-w-6xl mx-auto w-full border-b border-neutral-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-breath-cyan-green shadow-[0_0_12px_#06b6d4]" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">NAVIGATION INTERFACE LAB</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
            Aether Navigation Lab
          </h1>
          <p className="text-xs text-neutral-450 max-w-lg leading-relaxed font-light">
            An interactive showcase evaluating how users navigate between **Deadlines**, **Goals**, and **Habits**, and how they add new records. Play with live inline databases and modals.
          </p>
        </div>

        <a 
          href="/test" 
          className="group px-4 py-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-[10px] font-bold uppercase font-mono tracking-widest text-neutral-350 hover:text-white rounded-xl flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
        >
          <span>Go to Staging Area</span>
          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </header>

      {/* Grid container showcasing all 10 styles */}
      <main className="max-w-6xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-12 relative z-10">
        
        <InteractiveDeviceMockup 
          title="01 // Radial Swipable Carousel" 
          description="Slide options to the center. When active, it morphs into a white '+' card. Adding an item triggers the modal for the current page type."
          navBarType="radial-carousel"
        />

        <InteractiveDeviceMockup 
          title="02 // Apple Floating Dock" 
          description="A stationary rounded dock with a sliding glass capsule. Active tabs lift vertically and morph into the '+' FAB trigger."
          navBarType="apple-dock"
        />

        <InteractiveDeviceMockup 
          title="03 // Fluid Gooey Tab" 
          description="A liquid bubble sweeps across the navigation slots. Tapping the active fluid bubble morphs it to '+' to initialize creation."
          navBarType="gooey-tab"
        />

        <InteractiveDeviceMockup 
          title="04 // Global FAB Dock" 
          description="Traditional navigation. Tapping the central '+' trigger opens a global create menu, letting you add deadlines, goals, or habits from any page."
          navBarType="global-fab-dock"
        />

        <InteractiveDeviceMockup 
          title="05 // Neon Border Sweep Ring" 
          description="A wordless icon dock. Whichever page you view grows a neon breathing ring outer border sweep, and active slots trigger '+' inputs."
          navBarType="neon-sweep"
        />

        <InteractiveDeviceMockup 
          title="06 // Magnetic Sliding Pill" 
          description="Minimalist pill labels. An active white capsule backdrop slides horizontally under the tabs, transforming them to '+' indicators."
          navBarType="magnetic-pill"
        />

        <InteractiveDeviceMockup 
          title="07 // Corner Radial Fan Menu" 
          description="Combines navigation tabs with an anchored FAB. Tapping '+' fans out three distinct create buttons upwards."
          navBarType="corner-radial"
        />

        <InteractiveDeviceMockup 
          title="08 // Segmented Push-Key" 
          description="Tactile mechanical push keys. The active tab presses down and illuminates a cyan indicator light bar below the '+' icon."
          navBarType="mechanical-key"
        />

        <InteractiveDeviceMockup 
          title="09 // Text-To-Icon Morph Bar" 
          description="Horizontally aligned labels. When active, text fades away and a white square card with a '+' icon morphs in its place."
          navBarType="text-icon-morph"
        />

        <InteractiveDeviceMockup 
          title="10 // Minimalist Indicator Dot" 
          description="Cleanest layout. Active icons transform into a '+' FAB and float slightly upwards above a glowing cyan indicator dot."
          navBarType="minimalist-dot"
        />

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 text-center text-[10px] font-mono text-neutral-600 mt-20 select-none">
        <span>AETHER DESIGN LABS // SYSTEMS PROTOTYPE VERIFIED</span>
      </footer>
    </div>
  );
}
