import type { HelpFaqItem } from "@/types/help";
import { formatCoins } from "@/utils";

/**
 * Conteúdo extenso da Central de Ajuda em inglês (FAQ).
 * As tabelas de referência são geradas por `constants/helpTables.ts` para manter
 * uma única fonte de verdade matemática entre PT-BR e EN.
 */
const coins = (value: number) => formatCoins(value, { locale: "en" });

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
      "What is the difference between Essential Mode (Focus & Productivity) and Adventure Mode (RPG Immersion)?",
    answer:
      "HabitParty offers two modes with 100% functional parity — both run on the exact same mathematical engine, yield projections, 3:1–4:1 economy rules, Kanban boards, Focus timers (including the 90m ultradian cap and 8h daily sustainability ramp), and Store draws — only the visual theme, terminology, and default audio calibrate to your style:",
    bullets: [
      "Essential Mode (Clean Focus & Productivity): Sober, executive aesthetic without fantasy clutter. Uses Credits with a built-in leisure-time equivalence (4 min/Credit • 15 Credits = 1h free leisure) and Points (pts), displays professional ranks (Beginner to High Performance), clean Effort indicators (no swords), 'Strict Deadline' / 'Daily Commitment', Inventory, Break Draw (roulette for breaks/treats in the Store), and calm Zen audio cues.",
      "Adventure Mode (RPG Immersion): Full themed RPG experience with playful reward feedback. Turns deliverables into Gold Coins (🪙) and XP, displays adventurer ranks (Novice to Legend), sword icons for difficulty, Hardcore Mode, Mystery Boxes (luck draws by rarity) in the Store, a Backpack, and celebratory Arcade sound effects.",
      "1:1 Equivalence & Instant Switching: 1 Gold Coin = 1 Credit (≈ 4 min free leisure) and 1 XP = 1 Point (pts). Choose your profile during onboarding and switch anytime in Settings > Appearance > Experience Style with 1 click, keeping all balances, history, and levels intact.",
    ],
    tags: [
      "experience",
      "essential mode",
      "adventure mode",
      "productivity",
      "immersion",
      "gamification",
      "credits",
      "points",
      "coins",
      "xp",
      "rpg",
      "break draw",
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
      "HabitParty divides your routine into three complementary models and lets you organize everything with Hierarchical Tags (e.g., 'Study > English' using '>') to filter from broad areas to specifics:",
    bullets: [
      "Habits: Ongoing actions that can be positive (+), negative (-), or mixed. They have no fixed date, use Importance (Low, Normal, High), and include a Quick Focus button right on each row.",
      "Dailies: Recurring routines scheduled for specific weekdays (e.g., Mondays and Wednesdays). They automatically reset at midnight in your local timezone (along with their checklists), pay 100% base reward with no decay, and unlock a +10% consistency bonus after 14 consecutive scheduled completions.",
      "To-Dos: One-off tasks with a due date and optional deadline time (free), scheduled reminders, subtask checklists, and Rich-Text descriptions (lists, bold, links) up to 2,000 characters. Premium subscribers can also schedule To-Dos as Events (with start & end times or all-day duration) featuring a live pulsing 'In progress' badge.",
      "Rewarded Checklist Steps (Hard Dailies & To-Dos): For longer 2h+ blocks, instead of creating 'Part 1' and 'Part 2' cards, mark up to 4 checklist subtasks as Rewarded Steps (or Effort Steps in Essential Mode). Each step adds +100% of the base reward (+30 XP/pts and +5 🪙/Credits) and counts as +1 delivery unit in stats and achievements — all paid together when the parent card is completed.",
    ],
    tags: [
      "tasks",
      "habits",
      "dailies",
      "to-do",
      "routine",
      "tags",
      "rich-text",
      "rewarded steps",
      "subtasks",
      "checklist",
    ],
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
      "Midnight Penalty & Completed-Step Protection: If the activity is not finished by 11:59 PM of the due date, the system deducts 50% of Coins/XP (Adventure Mode) or Credits/Points (Essential Mode) from your balance. For Hard tasks with Rewarded Steps, the penalty applies only to the base task plus pending rewarded steps — steps already checked before the deadline are protected.",
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
    question:
      "Why are coin values so strict? How does the 3:1 to 4:1 Duty-vs-Reward ratio work?",
    answer:
      "HabitParty's closed economy is calibrated around a real-world 3:1 to 4:1 balance between productive duty and leisure rewards. A solid productive day typically earns around 15 to 20 coins (with an official benchmark of 15 🪙/day):",
    bullets: [
      "3:1 to 4:1 Balance (Effort vs. Leisure): Roughly 3 to 4 hours of real productive effort (medium/hard tasks, habits, and focus blocks) generate ~15 🪙 — the exact preset price for 1 hour of guilt-free leisure in the Store (15 🪙). Around 1.5–2 hours of effort earns ~8 🪙 for a 30-minute break.",
      "Anti-Inflation Integrity: If simple actions paid dozens of coins immediately, leisure hours would become artificially cheap and lose their psychological value.",
      "Identical in Essential Mode: In Essential Mode, the same math displays as Credits and Points (1 🪙 = 1 Credit), keeping the exact same 3:1 to 4:1 ratio. Personal honesty when scoring deliverables is the core engine of the app.",
    ],
    tags: [
      "economy",
      "math",
      "3:1",
      "4:1",
      "duty",
      "reward",
      "gold",
      "credits",
      "inflation",
      "rules",
    ],
    highlightBadge: "3:1–4:1 Ratio",
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
      "You create your own real-life products, breaks, and leisure packages. HabitParty offers three reward models:",
    bullets: [
      "Single-Use: Direct items to consume once (e.g., order a pizza, buy a book, have a specialty coffee).",
      "Time-Based: Packages with a predefined duration (e.g., 30 minutes of video games, 1 hour of free rest).",
      "Mystery Box (Adventure) / Break Draw (Essential): Rewards with a weighted roulette draw that picks a break or item from your configured pool.",
    ],
    tags: ["store", "rewards", "products", "time", "shopping", "draw"],
    actionLink: { label: "Explore the Store", href: "/rewards" },
  },
  {
    id: "mystery-box-system",
    category: "REWARDS",
    question:
      "How do Mystery Boxes (Adventure Mode) and Break Draws (Essential Mode) work?",
    answer: `When creating or buying a draw package in the Store (Mystery Box in Adventure Mode or Break Draw in Essential Mode), you choose between 4 balanced cost and weight tiers: Basic/Essential (${coins(5)}), Premium/Moderate (${coins(15)}), Epic/Advanced (${coins(35)}), and Legendary/Executive (${coins(80)}). The roulette follows that tier's weighted probability table and sends the drawn reward straight to your Backpack or Inventory!`,
    tags: ["mystery box", "break draw", "draw", "rng", "loot table", "prizes"],
    actionLink: { label: "See in the Store", href: "/rewards" },
  },
  {
    id: "inventory-usage",
    category: "INVENTORY",
    question: "Where do items go after being bought in the Store?",
    answer:
      "All purchased products go straight to your Backpack (Adventure Mode) or Inventory (Essential Mode). There you can view your available stock, consume an item when you enjoy the reward in real life, or start a focus session tied to that item.",
    tags: ["backpack", "inventory", "consumption", "items"],
    actionLink: { label: "Open Backpack / Inventory", href: "/inventory" },
  },
  {
    id: "focus-sessions",
    category: "FOCUS",
    question: "How do the Focus tools (Pomodoro & Stopwatch) work?",
    answer:
      "HabitParty comes with a built-in stopwatch and pomodoro. You can start focus sessions dedicated to study or work activities, logging completed minutes directly in your history and earning calibrated rewards in XP/Points (pts) and Coins/Credits.",
    bullets: [
      "Pomodoro: Predefined focus cycles (15 to 50 min) interleaved with breaks. When you complete a cycle, you earn the full block bonus.",
      "Free Stopwatch: For those who work in continuous flow. Rewards proportionally to focused time, up to a 90-minute ultradian cap per session.",
      "Backpack / Inventory in Focus: You can activate time items bought in the Store (e.g., breaks or gaming). The timer deducts your leisure balance without generating new earnings.",
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
      "To keep productivity fair, sustainable, and protected against a forgotten running timer or idle farming (in both modes):",
    bullets: [
      "Minimum Time: Sessions under 10 minutes are discarded and earn 0 points and 0 coins/credits.",
      "Anti-AFK / Ultradian Cycle Cap (90m): If the timer is left running for hours, payout is limited to a maximum of 90 continuous minutes.",
      "Daily Cap & Anti-Burnout Sustainability (8h Soft Cap): The first 4 daily hours of focus pay 100%. Between 4h and 6h pay 50%, and between 6h and 8h pay 25% (natural fatigue). Above 8h of daily focus, new sessions earn no coins/credits or XP/pts to prevent burnout and inflation (time is still logged in your metrics).",
      "Leisure Earns Nothing: Sessions with Backpack / Inventory items have a fixed yield of 0.",
    ],
    tags: ["focus", "economy", "anti-afk", "daily cap", "ultradian", "rewards"],
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
      "Expanded Capacity: Up to 4 Workspaces (double the free plan), up to 6 columns per board, up to 6 custom Focus activities, a backpack expanded to 100 items, and up to 50 reward cards in your store (vs. 12 on the free plan, with up to 4 packages per card).",
      "7 Atmospheric Visual Themes: The Free plan already includes 4 full themes (Cosmic Dark, Cosmic Daylight, Dark Knight, and Solar Parchment). Premium unlocks 3 exclusive VIP themes: Cyberpunk Neon, Forest Ranger, and Royal Gold.",
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
      "Behavioral Achievements & Rewarded Steps: Beyond volume, some medals reward how you work — completing 20 To-Dos before their due date (Royal Punctuality), finishing 7 cycles of Negative/Mixed Habits with zero relapses (Impulse Mastery), hitting 10 Focus Activity time goals (Bullseye Focus), completing 50 tasks with 100% of their checklist done (Flawless Checklist), burning Backpack time coupons on the Focus Stage, keeping 500 coins saved in your wallet, filling all 4 Showcase slots, or organizing your life into 2 Workspaces. On Hard tasks, each Rewarded Checklist Step also counts proportionally (+1 delivery unit) toward task, hard-task, Hardcore, and Retrospective totals.",
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
  {
    id: "friends-privacy-network",
    category: "OVERVIEW",
    question:
      "How do the Friend Network (/profile?tab=friends), HP-XXXXXX Friend Codes, and Privacy controls work?",
    answer:
      "In the Friends tab of your Profile (/profile?tab=friends), you can connect with others while keeping full control over what stays visible and never exposing private task lists or transaction ledgers:",
    bullets: [
      "Search & Unique Code: Find people by @username, name, or unique Friend Code (HP-XXXXXX). You also control in Settings who can send requests (Everyone, Friend Code Only, or Nobody).",
      "Real-Time Social Alerts: Incoming friend requests, acceptances, and social milestones appear in the Sidebar notification bell.",
      "Public Showcase & Granular Privacy: Visiting a friend's profile shows only the highlights they allow. In Settings > Privacy, you can independently hide XP/level, streaks, focus hours, or opt out of search discovery altogether.",
    ],
    tags: [
      "friends",
      "social",
      "privacy",
      "code",
      "hp-",
      "username",
      "showcase",
      "notifications",
    ],
    highlightBadge: "New • 1.4",
    actionLink: { label: "Open Friends Network", href: "/profile?tab=friends" },
  },
  {
    id: "retrospective-and-customization",
    category: "OVERVIEW",
    question:
      "How do the Annual Retrospective, PNG Cards, 7 Themes, and Timezone Rollover work?",
    answer:
      "Beyond daily planning, v1.4 introduces seasonal summaries and deep customization tailored to your local schedule:",
    bullets: [
      "Annual Retrospective & PNG Cards: Between Dec 20 and Jan 31, a seasonal banner on your Profile (/profile) reveals your year-in-review with 1 of 5 behavioral archetypes (based on consistency, focus, and execution). Collectible PNG cards for both Profile and Retrospective can be downloaded anytime.",
      "Timezone & Midnight Rollover: HabitParty automatically syncs your timezone so daily resets, streak deadlines, and reminders always align with your local midnight.",
      "7 Themes & Inline Quick Focus: Switch between 4 Free themes (2 dark, 2 light) and 3 VIP themes in Settings > Appearance, and launch a Focus timer directly from any Habit, Daily, or To-Do row.",
    ],
    tags: [
      "retrospective",
      "png",
      "card",
      "archetypes",
      "themes",
      "timezone",
      "midnight",
      "quick focus",
    ],
    highlightBadge: "New • 1.4",
    actionLink: { label: "Customize Appearance", href: "/settings" },
  },
];
