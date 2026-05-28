import { Goal, Subtask } from "./types";

export const getInitialSeedData = (): { goals: Goal[]; subtasks: Subtask[] } => {
  const goals: Goal[] = [
    {
      id: "seed-goal-java",
      user_id: null,
      title: "Java Mastery",
      tags: ["dev", "back-end", "language"],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      deltaPercent: 16,
      statusMessage: "You are on track to master Java core concepts.",
    },
    {
      id: "seed-goal-dsa",
      user_id: null,
      title: "Data Structures & Algorithms",
      tags: ["algorithms", "interview", "cs-core"],
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      deltaPercent: 11,
      statusMessage: "Progress is steady. Practice binary search and trees next.",
    },
    {
      id: "seed-goal-jobs",
      user_id: null,
      title: "Job Applications",
      tags: ["career", "outreach", "networking"],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      deltaPercent: 25,
      statusMessage: "Fixing CV and contacting companies in Bangladesh.",
    },
    {
      id: "seed-goal-visualizer",
      user_id: null,
      title: "Code Visualizer Project",
      tags: ["dev", "front-end", "architecture"],
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      deltaPercent: 14,
      statusMessage: "Monaco editor setup completed. Now working on compiler integrations.",
    },
    {
      id: "seed-goal-thesis",
      user_id: null,
      title: "Thesis Publication",
      tags: ["academic", "research", "writing"],
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      deltaPercent: 8,
      statusMessage: "Phase 2 BCS complete. Joint fine-tuning remains.",
    },
    {
      id: "seed-goal-fiverr",
      user_id: null,
      title: "Fiverr Freelancing",
      tags: ["freelance", "business", "side-gig"],
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      deltaPercent: 33,
      statusMessage: "Setup Payoneer. Ready to source your first order.",
    },
  ];

  const subtasks: Subtask[] = [
    // Java subtasks
    { id: "subtask-java-1", goal_id: "seed-goal-java", title: "Topic 1: Language Basics", is_complete: true },
    { id: "subtask-java-2", goal_id: "seed-goal-java", title: "Topic 2: OOP & Classes", is_complete: true },
    { id: "subtask-java-3", goal_id: "seed-goal-java", title: "Topic 3: Collections Framework", is_complete: true },
    { id: "subtask-java-4", goal_id: "seed-goal-java", title: "Topic 4: Multithreading & Concurrency", is_complete: true },
    { id: "subtask-java-5", goal_id: "seed-goal-java", title: "Topic 5: JVM Architecture & Memory", is_complete: false },
    { id: "subtask-java-6", goal_id: "seed-goal-java", title: "Topic 6: Spring Boot Basics", is_complete: false },

    // DSA subtasks
    { id: "subtask-dsa-1", goal_id: "seed-goal-dsa", title: "Arrays & Dynamic Arrays", is_complete: true },
    { id: "subtask-dsa-2", goal_id: "seed-goal-dsa", title: "HashMaps & Hashing", is_complete: true },
    { id: "subtask-dsa-3", goal_id: "seed-goal-dsa", title: "Two Pointers Techniques", is_complete: true },
    { id: "subtask-dsa-4", goal_id: "seed-goal-dsa", title: "Sliding Window", is_complete: false },
    { id: "subtask-dsa-5", goal_id: "seed-goal-dsa", title: "Stacks & Queues", is_complete: false },
    { id: "subtask-dsa-6", goal_id: "seed-goal-dsa", title: "Recursion & Backtracking", is_complete: false },
    { id: "subtask-dsa-7", goal_id: "seed-goal-dsa", title: "Binary Search", is_complete: false },
    { id: "subtask-dsa-8", goal_id: "seed-goal-dsa", title: "Trees & Binary Trees", is_complete: false },
    { id: "subtask-dsa-9", goal_id: "seed-goal-dsa", title: "SQL & Relational Databases", is_complete: false },

    // Job Applications
    { id: "subtask-jobs-1", goal_id: "seed-goal-jobs", title: "Fix CV / Resume", is_complete: true },
    { id: "subtask-jobs-2", goal_id: "seed-goal-jobs", title: "Send 5 apps", is_complete: true },
    { id: "subtask-jobs-3", goal_id: "seed-goal-jobs", title: "Brain Station 23 application", is_complete: false },
    { id: "subtask-jobs-4", goal_id: "seed-goal-jobs", title: "Therap BD application", is_complete: false },
    { id: "subtask-jobs-5", goal_id: "seed-goal-jobs", title: "BJIT application", is_complete: false },
    { id: "subtask-jobs-6", goal_id: "seed-goal-jobs", title: "Samsung R&D application", is_complete: false },

    // Code Visualizer
    { id: "subtask-vis-1", goal_id: "seed-goal-visualizer", title: "Setup Next.js & Tailwind CSS", is_complete: true },
    { id: "subtask-vis-2", goal_id: "seed-goal-visualizer", title: "Integrate Monaco Editor", is_complete: true },
    { id: "subtask-vis-3", goal_id: "seed-goal-visualizer", title: "Configure Pyodide for sandboxed runtime", is_complete: false },
    { id: "subtask-vis-4", goal_id: "seed-goal-visualizer", title: "Develop dynamic Variables panel", is_complete: false },
    { id: "subtask-vis-5", goal_id: "seed-goal-visualizer", title: "Build visual Call Stack tracker", is_complete: false },
    { id: "subtask-vis-6", goal_id: "seed-goal-visualizer", title: "Deploy production build to Vercel", is_complete: false },

    // Thesis
    { id: "subtask-thesis-1", goal_id: "seed-goal-thesis", title: "Phase 2 BCS analysis", is_complete: true },
    { id: "subtask-thesis-2", goal_id: "seed-goal-thesis", title: "Phase 3 Behavior analysis", is_complete: true },
    { id: "subtask-thesis-3", goal_id: "seed-goal-thesis", title: "Phase 4 Lameness analysis", is_complete: false },
    { id: "subtask-thesis-4", goal_id: "seed-goal-thesis", title: "Phase 5 ID metrics validation", is_complete: false },
    { id: "subtask-thesis-5", goal_id: "seed-goal-thesis", title: "Phase 6 Joint fine-tuning", is_complete: false },

    // Fiverr
    { id: "subtask-fiverr-1", goal_id: "seed-goal-fiverr", title: "Complete Fiverr developer profile", is_complete: true },
    { id: "subtask-fiverr-2", goal_id: "seed-goal-fiverr", title: "Setup & verify Payoneer bank sync", is_complete: true },
    { id: "subtask-fiverr-3", goal_id: "seed-goal-fiverr", title: "Source and secure your first order", is_complete: false },
  ];

  return { goals, subtasks };
};
