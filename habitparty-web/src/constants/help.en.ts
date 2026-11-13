import { FOCUS_REWARD_RULES } from "@/constants/focus";
import { MYSTERY_BOX_TIERS } from "@/constants/reward";
import { DIFFICULTY_REWARDS } from "@/constants/task";
import rewardsEn from "@/messages/en/rewards.json";
import type { HelpFaqItem, HelpTableEntry } from "@/types/help";
import { formatCoins } from "@/utils";
import {
  LEVEL_TITLES_EN,
  LEVEL_TITLES_PRODUCTIVITY_EN,
  USER_LEVELS,
} from "@/utils/levels";

/**
 * Conteúdo extenso da Central de Ajuda em inglês (FAQ e tabelas de referência).
 * Mantém exatamente a mesma estrutura de `constants/help.ts` (PT-BR) para que a
 * página selecione o idioma no servidor e envie ao cliente apenas o conteúdo ativo.
 */

const coins = (value: number) => formatCoins(value, { locale: "en" });

const LEVEL_PROGRESSION_META_EN: Record<
  string,
  { tasksEstimate: string; timeEstimate: string }
> = {
  NOVICE: { tasksEstimate: "Starting point", timeEstimate: "First login" },
  APPRENTICE: { tasksEstimate: "~7 medium tasks", timeEstimate: "Day 1 to 2" },
  ADVENTURER: { tasksEstimate: "~20 medium tasks", timeEstimate: "Week 1" },
  CHALLENGER: {
    tasksEstimate: "~50 medium tasks",
    timeEstimate: "2 to 3 weeks",
  },
  AMATEUR: {
    tasksEstimate: "~100 medium tasks",
    timeEstimate: "1 month of consistency",
  },
  PROFESSIONAL: {
    tasksEstimate: "~200 medium tasks",
    timeEstimate: "Quarterly",
  },
  EXPERT: { tasksEstimate: "~400 medium tasks", timeEstimate: "Semiannual" },
  VETERAN: {
    tasksEstimate: "~800 medium tasks",
    timeEstimate: "High maturity",
  },
  MASTER: {
    tasksEstimate: "~1,600 medium tasks",
    timeEstimate: "Rigorous consistency",
  },
  LEGEND: {
    tasksEstimate: "4,000+ medium tasks",
    timeEstimate: "Over 1 year daily",
  },
};

const MYSTERY_BOX_EMOJI_EN: Record<string, string> = {
  BASIC: "📦 Basic",
  PREMIUM: "🎁 Premium",
  EPIC: "💎 Epic",
  LEGENDARY: "👑 Legendary",
};

type TierDrops = Record<string, { label: string }>;

function getTierDropLabel(tierKey: string, index: number): string {
  const tiers = rewardsEn.mysteryBox.tiers as Record<
    string,
    { drops: TierDrops }
  >;
  return tiers[tierKey]?.drops[String(index)]?.label ?? "";
}

export const HELP_TABLES_EN: Record<string, HelpTableEntry> = {
  difficulties: {
    title: "Strict Economy: Difficulties & Rewards",
    description:
      "XP and coin (🪙) earnings based on the real effort load and estimated duration of each activity.",
    category: "ECONOMY",
    columns: [
      "Level",
      "Difficulty",
      "Base Reward",
      "Description & Usage Examples",
    ],
    rows: [
      [
        "🟦",
        "Trivial (Very Easy)",
        `${DIFFICULTY_REWARDS.TRIVIAL.xp} XP • ${coins(DIFFICULTY_REWARDS.TRIVIAL.gold)} 🪙`,
        "Almost automatic, very short tasks (e.g., drink water, take medicine, make the bed).",
      ],
      [
        "🟩",
        "Easy",
        `${DIFFICULTY_REWARDS.EASY.xp} XP • ${coins(DIFFICULTY_REWARDS.EASY.gold)} 🪙`,
        "Quick tasks that require basic intention (e.g., answer emails, 10 min of reading, wash the dishes).",
      ],
      [
        "🟨",
        "Medium (Standard)",
        `${DIFFICULTY_REWARDS.MEDIUM.xp} XP • ${coins(DIFFICULTY_REWARDS.MEDIUM.gold)} 🪙`,
        "The backbone of the economy: 30 to 60 minutes of moderate effort (e.g., workout, a work task).",
      ],
      [
        "🟪",
        "Hard",
        `${DIFFICULTY_REWARDS.HARD.xp} XP • ${coins(DIFFICULTY_REWARDS.HARD.gold)} 🪙`,
        "Intense cognitive or physical effort: 1 to 2 hours (e.g., heavy study session, programming project).",
      ],
    ],
  },
  habitDecay: {
    title: "Habits: Importance & Streak Decay",
    description:
      "As you repeat a habit, it demands less mental effort. To avoid inflation and encourage new challenges, the reward decays with the streak.",
    category: "TASKS",
    columns: [
      "Habit Phase",
      "Consecutive Days (Streak)",
      "% of Reward",
      "Psychological Goal",
    ],
    rows: [
      [
        "Resistance Phase",
        "Days 1 to 6",
        "100% of Reward",
        "Maximum activation energy to engage and break initial inertia.",
      ],
      [
        "Adaptation Phase",
        "Days 7 to 20",
        "75% of Reward",
        "Routine consolidation; the brain starts automating the process.",
      ],
      [
        "Habit Formed",
        "Day 21 or more",
        "50% of Reward",
        "Automated behavior; encourages taking on new challenges and goals.",
      ],
    ],
  },
  mysteryBoxes: {
    title: "🎁 Mystery Boxes (Loot Tables & RNG Odds)",
    description:
      "Lucky boxes mathematically balanced to deliver dopamine and surprise without unbalancing the game economy.",
    category: "REWARDS",
    columns: [
      "Package",
      "Cost (🪙)",
      "Common / Good Prize Odds",
      "Epic / Legendary Prize Odds",
    ],
    rows: MYSTERY_BOX_TIERS.map((tier) => {
      const tierKey = tier.backendPackageLevel;
      const format = (index: number, percentage: number) =>
        `${percentage}% ${getTierDropLabel(tierKey, index)}`;
      const commonDrops = tier.dropRates
        .slice(0, 2)
        .map((d, i) => format(i, d.percentage))
        .join(" • ");
      const rareDrops = tier.dropRates
        .slice(2)
        .map((d, i) => format(i + 2, d.percentage))
        .join(" • ");
      return [
        MYSTERY_BOX_EMOJI_EN[tierKey] || tierKey,
        `${coins(tier.recommendedPrice)} 🪙`,
        commonDrops,
        rareDrops,
      ];
    }),
  },
  userLevels: {
    title: "🏆 User Levels (UserLevel & Lifetime XP)",
    description:
      "Your total accumulated XP/Points is never spent or reset when buying rewards. The displayed rank title automatically adapts to your chosen style (Adventure Mode vs. Essential Mode).",
    category: "LEVELS",
    columns: [
      "Adventure Mode (RPG)",
      "Essential Mode (Productivity)",
      "Required XP / Points",
      "Estimated Medium Tasks",
      "Estimated Time",
    ],
    rows: USER_LEVELS.map((lvl) => {
      const meta = LEVEL_PROGRESSION_META_EN[lvl.tier];
      return [
        LEVEL_TITLES_EN[lvl.tier],
        LEVEL_TITLES_PRODUCTIVITY_EN[lvl.tier],
        `${lvl.minXpRequired.toLocaleString("en-US")} XP / pts`,
        meta?.tasksEstimate || "-",
        meta?.timeEstimate || "-",
      ];
    }),
  },
  focusRewards: {
    title: "⏱️ Focus Tools: Pomodoro, Stopwatch & Economy",
    description:
      "Focus rewards your journey and continuous effort with XP and small fractions of coins (🪙), keeping tasks as the main source of wealth.",
    category: "FOCUS",
    columns: [
      "Mode",
      "Duration / Cycle",
      "Base Reward",
      "Economy Rules & Locks",
    ],
    rows: [
      [
        "🍅 Short Pomodoro",
        "15 to 24 min",
        `${FOCUS_REWARD_RULES.SHORT_POMO_XP_PER_CYCLE} XP • ${coins(FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE)} 🪙`,
        "Quick inertia breaker (1/3 of 1 Easy Task). Requires a completed cycle.",
      ],
      [
        "🍅 Standard Pomodoro",
        "25 to 40 min",
        `${FOCUS_REWARD_RULES.STANDARD_XP_PER_CYCLE} XP • ${coins(FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE)} 🪙`,
        "The gold standard of focus. Worth ~30%–40% of a task deliverable.",
      ],
      [
        "🍅 Deep Work Pomodoro",
        "Over 40 min",
        `${FOCUS_REWARD_RULES.DEEP_WORK_XP_PER_CYCLE} XP • ${coins(FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE)} 🪙`,
        "Prolonged deep immersion. Worth 40% of the coins and 100% of the XP of 1 Medium Task.",
      ],
      [
        "⏱️ Free Stopwatch",
        "Every 30 min",
        `~${FOCUS_REWARD_RULES.STOPWATCH_XP_PER_30_MIN} XP • ${coins(FOCUS_REWARD_RULES.STOPWATCH_COINS_PER_30_MIN)} 🪙`,
        "Continuous proportional calculation. Capped at 90 min per session.",
      ],
      [
        "🛡️ Safety Locks",
        "General",
        "Daily Cap: 6h",
        "Minimum 10m to score. 4h–6h daily pays 50%. Above 6h pays 0%. Backpack items don't score.",
      ],
    ],
  },
  achievementRarities: {
    title: "🏅 Achievements Catalog, Rarities & Trophy Score (/profile)",
    description:
      "All 63 permanent achievements (4,170 pts in total) reward execution milestones, streaks, deep focus, economy goals, organization, and secret behaviors with Achievement Points (Trophy Score) and can be pinned to the 4 highlight slots on your Showcase.",
    category: "LEVELS",
    columns: [
      "Rarity / Tier",
      "Achievement Points",
      "Medals in Catalog",
      "Examples of Unlockable Milestones",
    ],
    rows: [
      [
        "⚪ Common",
        "+10 pts",
        "12 achievements",
        "1st Task, 10 Tasks, 3 and 7-day Streaks, 1st and 10 Focus Sessions, 100 Coins, 1st Reward, 100 / 300 / 750 XP, 1st Mystery Box (Secret).",
      ],
      [
        "🟢 Uncommon",
        "+25 pts",
        "14 achievements",
        "50 and 100 Tasks, 5 Hard Tasks, 14 and 21-day Streaks, 45m Deep Work, 25 Pomodoros, 500 Coins, 25 Rewards, 3,000 XP, 2 Workspaces, Complete Trophy Shelf (4 Highlights), 1st Hardcore (Secret), 5 Mystery Boxes (Secret).",
      ],
      [
        "🔵 Rare",
        "+50 pts",
        "18 achievements",
        "250 Tasks, Flawless Checklist (20), Royal Punctuality (20 On-Time To-Dos), 30 and 60-day Streaks, Impulse Mastery (7 Clean Habit Cycles), 90m Flow State, 10h Focus, Bullseye Focus (10 Activity Goals Met), 1,000 Coins, 500-coin Wallet, 5 Depleted Time Coupons, 6,000 / 12,000 XP, Curated Showcase, 10 Hardcore, Midnight Owl & Early Bird (Secret).",
      ],
      [
        "🟣 Epic",
        "+100 pts",
        "13 achievements",
        "500 Tasks, 25 Hard Tasks, 90 and 180-day Streaks, 50h / 100h Focus, 100 Pomodoros, 5,000 Coins, 100 Rewards, 25,000 XP, 1,000 Trophy Points, 50 Hardcore & 25 Mystery Boxes (Secret).",
      ],
      [
        "🟡 Legendary",
        "+250 pts",
        "6 achievements",
        "1,000 Tasks, 100 Hard Tasks, 365-day Streak, 200h Focus, 15,000 Coins Earned, Legend Rank (60,000 XP).",
      ],
    ],
  },
};

export const HELP_FAQS_EN: HelpFaqItem[] = [
  {
    id: "philosophy",
    category: "OVERVIEW",
    question: "What is HabitParty and what is its philosophy?",
    answer:
      "HabitParty is a gamified productivity engine with a closed economy. Unlike traditional to-do apps, it converts the user's real effort into Gold Coins (🪙) and Experience (XP) in Adventure Mode — or into Credits and Points (pts) in Essential Mode — using strict mathematical rules. Your earned balance is used to 'buy' real leisure moments in the Store (playing video games, watching series, guilt-free breaks), turning rest into something earned and free of procrastination.",
    tags: [
      "overview",
      "gamification",
      "introduction",
      "philosophy",
      "coins",
      "credits",
      "points",
    ],
    highlightBadge: "Essential",
    actionLink: { label: "Go to Dashboard", href: "/dashboard" },
  },
  {
    id: "experience-modes",
    category: "OVERVIEW",
    question:
      "What is the difference between Essential Mode (Productivity) and Adventure Mode (RPG)?",
    answer:
      "HabitParty offers two experience profiles powered by the exact same mathematical consistency engine, Kanban boards, Pomodoro timer, and transaction history, adapting terminology, visual indicators, and reward mechanics to your workflow:",
    bullets: [
      "Essential Mode (Productivity): Gamified productivity with a clean, executive aesthetic. It replaces Gold Coins with Credits and XP with Points (pts), uses professional progression titles (Beginner to High Performance), shows discreet Effort indicators (instead of swords), focuses on direct personal rewards in the Store (without Mystery Box RNG), and uses executive terminology ('Strict Deadline' instead of 'Hardcore Mode' and 'Inventory' instead of 'Backpack').",
      "Adventure Mode (RPG Immersion): Full RPG gamification with immediate dopamine feedback. It turns your daily grind into quests with Gold Coins (🪙) and lifetime XP, adventurer ranks (Novice to Legend), sword icons for task difficulty, high-stakes Hardcore Mode, Mystery Boxes (Gacha/RNG) in the Store, an item Backpack, and celebratory sound effects.",
      "1:1 Equivalence & Instant Switching: 1 Gold Coin equals 1 Credit, and 1 XP equals 1 Point (pts). You choose your profile during onboarding and can switch anytime in Settings > Appearance > Experience Style with 1 click, keeping all your balance, level, and history intact.",
    ],
    tags: [
      "experience",
      "essential mode",
      "adventure mode",
      "productivity",
      "gamification",
      "credits",
      "points",
      "coins",
      "xp",
      "rpg",
      "settings",
    ],
    highlightBadge: "Experience",
    actionLink: { label: "Configure Mode", href: "/settings" },
  },
  {
    id: "task-types",
    category: "TASKS",
    question: "What is the difference between Habits, Dailies, and To-Dos?",
    answer:
      "HabitParty splits your routine into three well-defined modes to keep your mind focused:",
    bullets: [
      "Habits: Ongoing actions that can be positive (+), negative (-), or mixed. They have no fixed date and work with Importance (Low, Normal, High) and a Streak system.",
      "Dailies: Recurring routines that must be done on specific weekdays (e.g., Mondays and Wednesdays). They reset periodically.",
      "To-Dos: One-off tasks with a due date and optional deadline time (free), scheduled reminders, subtask checklists, and rich descriptions up to 5,000 characters. Premium subscribers can also schedule To-Dos as Events (with start & end times or all-day duration) featuring a live pulsing 'In progress' badge on the board.",
    ],
    tags: ["tasks", "habits", "dailies", "to-do", "routine"],
    highlightBadge: "Structure",
    actionLink: { label: "View My Tasks", href: "/tasks" },
  },
  {
    id: "hardcore-mode",
    category: "TASKS",
    question:
      "What is Strict Deadline / Daily Commitment / Hardcore Mode on tasks?",
    answer:
      "It is a high-accountability commitment available for Habits, Dailies, and To-Dos. Its name adapts to your active Experience Mode and task type: it is called 'Strict Deadline' (on To-Dos) or 'Daily Commitment' (on Habits/Dailies) in Essential Mode (Productivity), and 'Hardcore Mode' in Adventure Mode (RPG). When enabled:",
    bullets: [
      "To-Dos: The due date becomes mandatory and cannot be postponed once overdue. Completing an overdue task yields only 50% of the normal reward.",
      "Midnight Penalty: If the activity is not finished by 11:59 PM of the due date, the system deducts 50% of Coins/XP (in Adventure Mode) or Credits/Points (in Essential Mode) from your balance.",
      "Habits & Dailies: Missing a non-negotiable routine resets your streak to Day 1 and incurs the disciplinary deduction.",
      "When to use: Reserve strictly for 1 or 2 critical, non-negotiable commitments to prevent procrastination and self-sabotage.",
    ],
    tags: [
      "strict deadline",
      "hardcore",
      "penalty",
      "commitment",
      "discipline",
      "anti-procrastination",
      "hard deadline",
      "to-do",
    ],
    highlightBadge: "Discipline",
  },
  {
    id: "email-reminders-quota",
    category: "TASKS",
    question: "How do email reminders for To-Dos work and what are the limits?",
    answer:
      "When creating or editing a To-Do with a due date, you can set reminder alarms (1 day before, 2 days before, 3 days before, 1 week before, or a custom date and time). If you check 'Receive email reminder', HabitParty will send an alert straight to your inbox at the scheduled time. To keep the service stable, the limits are:",
    bullets: [
      "Adventurer Plan (Free): Up to 5 To-Dos with active email reminders at the same time and a quota of up to 20 sends per month. Completing the task or sending the alert frees the slot automatically.",
      "Cosmic Guardian Plan (Premium): Up to 30 To-Dos with active email reminders at the same time and an expanded quota of up to 100 sends per month (Fair Use Policy).",
    ],
    tags: [
      "reminders",
      "email",
      "resend",
      "notification",
      "to-do",
      "limits",
      "premium",
      "free",
    ],
    highlightBadge: "Important",
  },
  {
    id: "economy-inflation",
    category: "ECONOMY",
    question: "Why are coin and XP values so strict?",
    answer:
      "HabitParty's economy is calibrated so that you need a truly productive day (completing medium and hard tasks) to accumulate between 60 and 80 coins. If the system paid hundreds of coins for any simple action, the feeling of achievement would be destroyed by artificial inflation. User honesty is the core engine of the app's effectiveness.",
    tags: ["economy", "math", "gold", "inflation", "rules"],
  },
  {
    id: "habit-reset",
    category: "ECONOMY",
    question: "What happens if I break a habit's Streak?",
    answer:
      "If you break a habit's streak, it resets to Day 1. The upside is that the coin reward goes back to 100% of its maximum capacity, giving you a renewed incentive boost to rebuild your discipline.",
    tags: ["streak", "reset", "decay", "habits"],
  },
  {
    id: "rewards-store",
    category: "REWARDS",
    question: "How does the Rewards Store work?",
    answer:
      "You create your own real-life products and leisure packages. HabitParty offers three reward models:",
    bullets: [
      "Single-Use: Direct items to consume once (e.g., order a pizza, buy a book, have a specialty coffee).",
      "Time-Based: Packages with a predefined duration (e.g., 30 minutes of video games, 1 hour of social media).",
      "Mystery Box: Rewards that draw items by rarity (Common to Legendary).",
    ],
    tags: ["store", "rewards", "products", "time", "shopping"],
    actionLink: { label: "Explore the Store", href: "/rewards" },
  },
  {
    id: "mystery-box-system",
    category: "REWARDS",
    question: "How do Mystery Boxes (RNG) work?",
    answer: `When creating or buying a Mystery Box in the Store, you choose between 4 gamified tiers with balanced costs and odds: Basic (${coins(5)} 🪙), Premium (${coins(15)} 🪙), Epic (${coins(35)} 🪙), and Legendary (${coins(80)} 🪙). The draw follows the matching package's Loot Table and the prize goes straight to your Backpack, letting you win amazing rewards depending on your luck!`,
    tags: ["mystery box", "draw", "rng", "loot table", "prizes"],
    actionLink: { label: "See Boxes in the Store", href: "/rewards" },
  },
  {
    id: "inventory-usage",
    category: "INVENTORY",
    question: "Where do items go after being bought in the Store?",
    answer:
      "All purchased products go straight to your Backpack (Inventory). There you can view your available stock, consume an item when you enjoy the reward in real life, or start a focus session tied to that item.",
    tags: ["backpack", "inventory", "consumption", "items"],
    actionLink: { label: "Open My Backpack", href: "/inventory" },
  },
  {
    id: "focus-sessions",
    category: "FOCUS",
    question: "How do the Focus tools (Pomodoro & Stopwatch) work?",
    answer:
      "HabitParty comes with a built-in stopwatch and pomodoro. You can start focus sessions dedicated to study or work activities, logging completed minutes directly in your history and earning calibrated rewards in XP and coins (🪙).",
    bullets: [
      "Pomodoro: Predefined focus cycles (15 to 50 min) interleaved with breaks. When you complete a cycle, you earn the full block bonus.",
      "Free Stopwatch: For those who work in continuous flow. Rewards proportionally to focused time, up to a cap of 90 minutes per session.",
      "Backpack / Leisure in Focus: You can activate time items bought in the Store (e.g., video games). The timer deducts your leisure balance but does not generate new earnings.",
    ],
    tags: ["focus", "pomodoro", "stopwatch", "study", "timer"],
    highlightBadge: "Focus",
    actionLink: { label: "Start Focus Session", href: "/focus" },
  },
  {
    id: "focus-economy",
    category: "FOCUS",
    question: "How does the Focus economy and anti-abuse locks work?",
    answer:
      "To keep gamification fair, rewarding, and protected against a forgotten running timer or idle farming:",
    bullets: [
      "Minimum Time: Sessions under 10 minutes are discarded and earn 0 XP and 0 coins.",
      "Anti-AFK Cap: If the timer is left running for hours, payout is limited to a maximum of 90 continuous minutes.",
      "Daily Cap & Diminishing Returns (Soft Cap): The first 4 daily hours of focus pay 100%. Between 4h and 6h pay 50% (natural fatigue). Above 6h of daily focus, new sessions earn no XP or coins to prevent burnout and hyperinflation (time is still logged in your stats).",
      "Leisure Earns Nothing: Sessions with backpack inventory items have a fixed yield of 0 XP and 0 coins.",
    ],
    tags: ["focus", "economy", "anti-afk", "daily cap", "rewards"],
  },
  {
    id: "workspaces-concept",
    category: "OVERVIEW",
    question: "What are Workspaces and how should I organize them?",
    answer:
      "Workspaces let you fully separate your life streams. You can keep one workspace for 'Work / Career', another for 'College / Exams', and one for 'Personal Life'. Each workspace has its own Kanban board with custom columns and includes smart cross-workspace search: when searching for a task, the app automatically alerts you if matches exist in your other workspaces so you can switch with 1 click.",
    tags: ["workspaces", "areas", "kanban", "organization", "search"],
    actionLink: { label: "Manage Board", href: "/tasks" },
  },
  {
    id: "user-plans",
    category: "OVERVIEW",
    question:
      "What is the difference between the Free account and the Premium subscription?",
    answer:
      "The Free account offers full access to all essential tools: tasks, habits, the mathematical economy, store, and backpack. The Cosmic Guardian (Premium) plan is designed for those who manage advanced routines and want maximum aesthetic customization and immersion:",
    bullets: [
      "To-Dos as Scheduled Events: Schedule tasks with start & end times or all-day duration, complete with a live pulsing 'In progress' badge on the board.",
      "Cosmic Avatar Frames: 5 exclusive animated frames with a radiant aura and light pulse for your profile.",
      "Focus Ambient Sounds: Relaxing sounds natively synthesized in the Pomodoro (Gentle Rain, Coffee Shop, Zen Lofi, and Campfire).",
      "VIP Icon Pack: An exclusive collection of golden icons for columns, routines, focus, and store items.",
      "Expanded Capacity: Up to 4 Workspaces (double the free plan), up to 6 columns per board, up to 6 custom Focus activities, a backpack expanded to 100 items, and up to 100 registered rewards.",
      "Profile Highlight: Cosmic Guardian VIP badge and a stellar golden ring on your avatar.",
      "Plans & Payment: $1.99/month or $19.90/year (~17% savings), paid by recurring credit card.",
    ],
    tags: [
      "plan",
      "free",
      "premium",
      "perks",
      "benefits",
      "cosmic guardian",
      "subscription",
      "frames",
      "ambient sounds",
      "events",
    ],
    highlightBadge: "Plans",
    actionLink: { label: "View Plans & Subscription", href: "/settings" },
  },
  {
    id: "avatar-frames",
    category: "OVERVIEW",
    question: "How do Avatar Frames and profile customization work?",
    answer:
      "In your Profile Showcase (/profile), clicking the frame icon on your avatar lets you choose animated circular frames that wrap your photo with cosmic light effects and stellar gradients. Free users get the clean classic frame, while Cosmic Guardian subscribers have unrestricted access to all 5 animated frames: Cosmic Guardian (stellar gold), Cyberpunk Neon (cyan and magenta pulse), Phoenix Fire (blazing flames), Emerald Aura (mystic green), and Amethyst Void (arcane violet).",
    tags: ["frames", "avatar", "profile", "customization", "cosmetics", "vip"],
    highlightBadge: "Visual",
    actionLink: { label: "Customize on Showcase", href: "/profile" },
  },
  {
    id: "ambient-sounds",
    category: "FOCUS",
    question: "How do Ambient Sounds work in Focus Mode?",
    answer:
      "HabitParty's ambient sounds are generated with the browser's native Web Audio API, ensuring zero latency, minimal memory usage, and 100% offline operation. Premium subscribers can switch between four relaxing soundscapes to silence distractions and get into a flow state:",
    bullets: [
      "Gentle Rain: Continuously filtered pink noise simulating soft, steady rain.",
      "Coffee Shop: Warm mid-frequency filtering simulating the calm murmur of a café.",
      "Zen Lofi: A continuous harmonic chord (C3, G3, C4, E4) in filtered sine waves for deep focus.",
      "Campfire: A warm acoustic background with random crackles of embers and burning wood.",
      "Controls: Sound can be enabled and adjusted both in Settings > Audio and directly in the audio popover during the Focus/Pomodoro timer.",
    ],
    tags: [
      "ambient sounds",
      "focus",
      "pomodoro",
      "rain",
      "coffee shop",
      "lofi",
      "campfire",
      "audio",
    ],
    highlightBadge: "Focus",
    actionLink: { label: "Configure Sounds & Audio", href: "/settings" },
  },
  {
    id: "payment-cancellation",
    category: "OVERVIEW",
    question: "How do subscription payment and cancellation work?",
    answer:
      "HabitParty uses Stripe's secure global payment infrastructure. Payments outside Brazil are made by credit card:",
    bullets: [
      "Credit Card (Recurring): Automatic monthly or annual renewal. You can cancel anytime with 1 click via Settings > Profile > Manage Subscription (Stripe Portal). When you cancel, your Premium access remains active until the end of the period already paid.",
    ],
    tags: ["payment", "stripe", "cancellation", "card", "subscription"],
    actionLink: { label: "Manage Subscription", href: "/settings" },
  },
  {
    id: "premium-expiration-data",
    category: "OVERVIEW",
    question:
      "What happens to my columns, workspaces, and data when Premium expires?",
    answer:
      "No data or task is ever deleted! HabitParty has an absolute zero-data-loss commitment. When your Premium period expires (or you go back to the Free plan), all your structures stay intact in the database and the system applies a smooth, transparent downgrade:",
    bullets: [
      "Board Columns (up to 6 created): The routine board shows up to 4 active columns at a time (Free limit). The other columns are preserved and hidden from the board. You can open the column manager at any time and freely choose which 4 columns stay active day to day.",
      "Focus Activities (up to 6 created): The first 4 activities stay active and sortable; the last 2 are preserved and paused until renewal.",
      "Workspaces: All created workspaces remain saved and accessible in read-only mode (Locked 👑), so you can check tasks at any time.",
      "Tasks & History: All tasks inside columns or workspaces remain preserved, so you can complete, move, or edit them.",
      "Backpack Items & Store: Items already bought in your backpack are never lost (acquired right). You can consume them normally.",
      "Sidebar Advance Notice: So you're never caught off guard, a countdown appears in the Sidebar footer when 7, 3, and 1 day remain to renew with 1 click.",
      "Instant Reactivation: When you renew Premium at any time, all your extra features (6 columns with scroll, animated frames, ambient sounds, and 4 workspaces) come back instantly without any reconfiguration.",
    ],
    tags: [
      "expiration",
      "premium",
      "columns",
      "backpack",
      "data",
      "security",
      "workspaces",
      "downgrade",
      "free",
      "notice",
    ],
    highlightBadge: "Transparency",
  },
  {
    id: "profile-showcase",
    category: "LEVELS",
    question:
      "How do the Profile Showcase (/profile) and the 4 Highlight Slots work?",
    answer:
      "Clicking your profile card in the bottom of the Sidebar opens your Adventurer Showcase (/profile). It acts as your official calling card, combining your visual identity, lifetime statistics, and a customizable trophy shelf at the top:",
    bullets: [
      "Identity & Bio: Display your Avatar with an Animated Frame, Pioneer Founder or VIP badge, current level rank, total achievement score (🏆 pts), and a custom motto/bio of up to 160 characters.",
      "4 Highlight Slots (Trophy Shelf): Freely pick up to 4 items to pin at the top of your showcase — mixing Unlocked Achievements and Account Badges (Founder, VIP Guardian, Verified Account, and Level Rank). Your lifetime stats (Streaks, Focus Hours, Tasks, and XP) are displayed right below in dedicated stat cards.",
      "Visitor View Mode: Toggle the 'Visitor View' button at the top of your showcase with 1 click to preview how your profile looks without editing controls.",
    ],
    tags: [
      "showcase",
      "profile",
      "highlights",
      "badges",
      "bio",
      "founder",
      "trophy shelf",
    ],
    highlightBadge: "New • 1.2",
    actionLink: { label: "Open My Showcase", href: "/profile" },
  },
  {
    id: "achievements-system",
    category: "LEVELS",
    question:
      "How do the 63 Achievements, Achievement Points, and Secret Medals work?",
    answer:
      "HabitParty's Achievements system features 63 permanent medals (4,170 pts in total) across 6 categories (Quests & Execution, Streaks, Focus, Economy & Shop, Progression, and Special) and 5 rarity tiers (Common to Legendary):",
    bullets: [
      "Real-Time Automatic Unlocking: Whenever you complete a task, log a habit check-in, finish a focus session, redeem a reward, open a Mystery Box, or create a new Workspace, the server evaluates your progress and unlocks new medals automatically with a crystalline trophy sound effect.",
      "Achievement Points (Trophy Score): Each medal grants from +10 pts (Common) to +250 pts (Legendary), building your prestige score displayed in the Sidebar and Showcase (without inflating the shop coin economy). Reaching 1,000 pts also unlocks the 'Glory Collector' medal.",
      "Behavioral Achievements: Beyond volume, some medals reward how you work — completing 20 To-Dos before their due date (Royal Punctuality), finishing 7 cycles of Negative/Mixed Habits with zero relapses (Impulse Mastery), hitting 10 Focus Activity time goals (Bullseye Focus), completing tasks with 100% of their checklist done, burning Backpack time coupons on the Focus Stage, keeping 500 coins saved in your wallet, filling all 4 Showcase slots, or organizing your life into 2 Workspaces.",
      "Secret Achievements (???): 8 special medals (Hardcore, Mystery Boxes, Midnight Owl, and Early Bird) remain masked with '???' until you discover and fulfill their secret condition. Focus session times use your device's local clock.",
    ],
    tags: [
      "achievements",
      "medals",
      "trophies",
      "achievement points",
      "secret",
      "rarity",
      "sound",
    ],
    highlightBadge: "New • 1.2",
    actionLink: { label: "View Achievements Gallery", href: "/profile" },
  },
  {
    id: "history-batch-and-time-format",
    category: "ECONOMY",
    question:
      "How do Batch History Deletion, Column Snapshots, and the 12h/24h Time Format work?",
    answer:
      "To keep your financial ledger and time display tailored to your workflow, HabitParty provides advanced audit and formatting controls:",
    bullets: [
      "Multi-Selection & Batch Deletion: On the History screen (/history), select multiple entries (or click 'Select all') to delete unwanted transactions in bulk using the floating action bar.",
      "Synchronized Deletion: When deleting a task or focus session, you can optionally purge its linked coin and XP transactions from your History at the same time.",
      "Kanban List Snapshots: Every task transaction records the original Kanban column name at the moment of completion, preserving historical context even if the column is later renamed or deleted.",
      "Time Format (12h AM/PM or 24h): In Settings > Appearance, switch between 24-hour time (e.g., 14:30) and 12-hour time (e.g., 2:30 PM), syncing cards, detail popovers, time pickers, history, and focus logs.",
    ],
    tags: [
      "history",
      "ledger",
      "batch",
      "delete",
      "time format",
      "12h",
      "24h",
      "am/pm",
      "snapshot",
    ],
    highlightBadge: "New • 1.3",
    actionLink: { label: "Open History", href: "/history" },
  },
];
