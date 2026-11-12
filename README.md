# 👥 HabitParty (Gamified Productivity Engine)

> 🌐 **Language / Idioma:** **English** | [Português (PT-BR)](README_pt-BR.md)

An open-core productivity and gamification system featuring a strict mathematical economy for earning coins, combined with a flexible and friendly reward system. HabitParty is built to boost your productivity by ensuring that real-world effort is converted into exact currency value to redeem personal real-life rewards.

> **Core Philosophy:** HabitParty is built primarily on your honesty and commitment! There is no way to cheat yourself: every completed task brings genuine satisfaction and guilt-free rest.

---

## ✨ Key Features

* **Complete Routine Management:** Clear workflow division into **Habits** (with positive/negative streaks and biological decay), **Dailies** (recurring routines with day-of-week scheduling), and **To-Dos** (single-run tasks with due dates, deadline times, subtask checklists, and VIP scheduled events with start/end times or all-day toggle).
* **Two Experience Modes (Essential vs. Adventure):** Switch anytime between two visual and semantic profiles with `1:1` mathematical parity:
  * 🎯 **Essential Mode (Productivity):** Clean, executive aesthetic. Converts deliverables into **Credits** and **Points (`pts`)**, uses professional progression titles (`Beginner` to `High Performance`), discreet **Effort** indicators, direct personal rewards in the Store (without RNG draws), **Strict Deadline**, and **Inventory**.
  * ⚔️ **Adventure Mode (RPG Immersion):** Full RPG gamification with **Gold Coins (🪙)** and **XP**, adventurer ranks (`Novice` to `Legend`), sword icons for **Difficulty**, **Mystery Boxes (Gacha)**, **Hardcore Mode**, and **Backpack**.
* **Strict Farming Economy:** Coin/Credit and XP/Point earnings are strictly calculated based on task difficulty/effort:
  * 🟩 **Trivial** (0.25 🪙 / Credits • 2 XP / pts)
  * 🟦 **Easy** (0.75 🪙 / Credits • 5 XP / pts)
  * 🟨 **Medium** (2.50 🪙 / Credits • 15 XP / pts)
  * 🟧 **Hard** (5.00 🪙 / Credits • 30 XP / pts)
* **Kanban Board & Multiple Workspaces:** Segregate different areas of your life (Work, Studies, Personal Routine) into isolated workspaces featuring customizable Kanban boards, columns, and smart cross-workspace search hints.
* **Real-Life Reward Store:** Build your own catalog of leisure and recovery rewards categorized into packages (Single Use, Time-Based Coupons, or Mystery Boxes) balanced with your daily effort.
* **🎁 Mystery Boxes (Optional RNG):** Weighted probability loot boxes calibrated mathematically across 4 tiers (Basic, Premium, Epic, Legendary) to bring excitement without breaking your personal economy.
* **🎒 Inventory Backpack:** Purchased rewards are stored in your backpack to be consumed whenever you take your break or linked directly to a timed leisure focus session.
* **⏱️ Focus Hero Stage (Pomodoro & Free Stopwatch):** Native immersion timer featuring daily diminishing returns (*daily soft cap* up to 6h), anti-AFK safeguards (90 min cap per session), and leisure safeguards (backpack leisure sessions yield zero coins).
* **👑 VIP Personalization, Events & Ambient Sound:** Schedule To-Dos as timed or all-day Events, unlock animated cosmic avatar frames, procedural ambient noise synthesized natively in the browser via Web Audio API (Gentle Rain, Cozy Cafe, Lofi Zen, Fireplace), and an exclusive VIP icon package.
* **🛡️ Admin Dashboard & Observability (`/admin`):** Dedicated administrative panel for users with `ROLE_ADMIN` featuring real-time **Resend** monthly email quota telemetry, platform-wide task volume tracking, estimated PostgreSQL database storage footprint breakdown per user, role management, and email dispatch audit logs (`EmailDispatchLog`).
* **✉️ Email Reminders & Notifications (Resend):** Automated task deadline reminders and password reset flows with per-user quota controls to prevent email flooding.
* **🔑 Hybrid Authentication & Security:** Native support for social login via **Google OAuth 2.0** and standard email/password authentication using stateless JWT, Refresh Tokens, BCrypt password hashing, and Role-Based Access Control (RBAC).
* **📊 Data Audit & Export (CSV):** Detailed daily productivity history with batch multi-selection management, list origin snapshots, and the ability to export full transaction ledgers (coins, XP, purchases) to CSV spreadsheets.

---

## 🎮 Gamification Engine (Economy & Progression)

The progression system is driven by lifetime Experience Points (XP / Points) earned from completing tasks. The leveling curve is exponential: early levels grant quick wins for onboarding and momentum, while advanced ranks demand long-term consistency.

### 📊 Task Difficulties & Rewards (XP & Coins)

Rewards reflect real effort and estimated time required for each activity:

| Tier | Difficulty | Reward | Description & Typical Examples |
| :---: | :--- | :--- | :--- |
| 🟩 | **Trivial** | 2 XP <br> 0.25 🪙 | Almost automatic, short actions. <br>*Ex: Drinking water, taking vitamins, making the bed.* |
| 🟦 | **Easy** | 5 XP <br> 0.75 🪙 | Quick tasks requiring basic intent or organization. <br>*Ex: Replying to emails, 10 min reading, washing dishes.* |
| 🟨 | **Medium** (Standard) | 15 XP <br> 2.50 🪙 | The backbone of the economy. Moderate focus (30 to 60 minutes). <br>*Ex: Gym workout, focusing on a work deliverable, cleaning the house.* |
| 🟧 | **Hard** | 30 XP <br> 5.00 🪙 | Intense cognitive or physical effort (1 to 2 hours of deep work). <br>*Ex: Focused study session, complex software engineering task.* |

---

### 🔄 Habits: Importance & Reward Decay

Unlike To-Dos and Dailies which use "Difficulty", Habits are measured by **Importance** (Low, Normal, High). The biological purpose of a habit is mental automation: repeated behaviors demand less cognitive activation over time.

To simulate this and prevent coin hyperinflation, habits feature **reward decay** based on your active streak. If the streak is broken, it resets to Day 1, restoring the reward to 100% as an incentive boost.

| Level | Base Reward (Initial Streak) | Description & Examples |
| :--- | :---: | :--- |
| 🟩 **Low** | 5 XP • 0.75 🪙 | Simple daily maintenance habits. <br>*Ex: Taking daily creatine, tidying your desk.* |
| 🟨 **Normal** (Standard) | 10 XP • 1.75 🪙 | The core of routine building. Moderate effort. <br>*Ex: Practicing an instrument for 15 min, reading 10 pages.* |
| 🟧 **High** | 25 XP • 3.75 🪙 | High activation energy habits. <br>*Ex: Solving 30 exam questions, high-intensity workout.* |

#### Streak Decay Table
* **Days 1 to 6 (Resistance Phase):** 100% Reward (maximum incentive to overcome initial inertia).
* **Days 7 to 20 (Adaptation Phase):** 75% Reward (routine stabilization).
* **Days 21+ (Formed Habit):** 50% Reward (automated behavior; encouragement to adopt new challenges).

---

### 🛒 Example Reward Store (Balanced Economy)

To sustain motivation, store prices must align with daily earnings. In a typical productive day generating 60 to 80 coins, a sample catalog looks like:

| Reward | Cost | Type | Concept |
| :--- | :---: | :--- | :--- |
| **Coffee Break** | 3.75 🪙 | Time (15 min) | A quick guilt-free coffee break during work. |
| **TV Episode** | 7.50 🪙 | Single Use | Watching an episode of your favorite show. |
| **Gaming Session** | 15.00 🪙 | Time (1h) | Guilt-free PC or console gaming block. |
| **Pizza Night** | 25.00 🪙 | Single Use | Weekend delivery treat. |
| **Epic Mystery Box** | 35.00 🪙 | RNG Drop | Roll the dice for high-tier or extended rewards! |
| **Buy a Book/Game** | 62.50 🪙 | Single Use | Long-term milestone to purchase a desired real-world item. |

---

### 🎁 Mystery Boxes (RNG Loot Tables)

When purchasing a Mystery Box, the system rolls a weighted probability table based on 4 balanced tiers:

| Tier | Cost | Drop Probabilities & Perks |
| :--- | :---: | :--- |
| 📦 **Basic** | 5.00 🪙 | **60%** Short Break (10-15m) <br> **30%** Medium Leisure (30m) <br> **10%** Focused Session (45m + 1 🪙 bonus) |
| 🎁 **Premium** | 15.00 🪙 | **50%** Standard Leisure (45-60m) <br> **35%** Extended Leisure (75-90m) <br> **15%** Gaming / Cinema Night (120m) |
| 💎 **Epic** | 35.00 🪙 | **50%** Extended Block (120m) <br> **35%** Free Evening (180m) <br> **15%** Full Afternoon Disconnect (240m) |
| 👑 **Legendary** | 80.00 🪙 | **60%** Elite Partial Day-Off (240m) <br> **30%** Full Day-Off <br> **10%** The Holy Grail (Free Weekend + Ultimate Treat) |

---

### 🏆 User Levels (`UserLevel`)

Player progression is tracked by lifetime cumulative XP (`totalXp`), which is **never spent or reset** when buying rewards. Rank titles automatically adapt to your active Experience Mode (Adventure Mode vs. Essential Mode):

| Tier | Adventure Mode (EN / PT-BR) | Essential Mode (EN / PT-BR) | Required XP / Points | Estimated Effort |
| :--- | :--- | :--- | :---: | :--- |
| `NOVICE` | Novice / Novato | Beginner / Iniciante | 0 XP / pts | Starting point. |
| `APPRENTICE` | Apprentice / Aprendiz | Practitioner / Praticante | 100 XP / pts | ~7 medium tasks (1st to 2nd day). |
| `ADVENTURER` | Adventurer / Aventureiro | Consistent / Consistente | 300 XP / pts | ~20 medium tasks (1st week). |
| `CHALLENGER` | Challenger / Desafiante | Focused / Focado | 750 XP / pts | ~50 medium tasks (2 to 3 weeks). |
| `AMATEUR` | Amateur / Amador | Organized / Organizado | 1,500 XP / pts | ~100 medium tasks (~1 month of consistency). |
| `PROFESSIONAL` | Professional / Profissional | Productive / Produtivo | 3,000 XP / pts | Demands quarterly consistency. |
| `EXPERT` | Expert / Especialista | Specialist / Especialista | 6,000 XP / pts | Mid-to-long term dedicated user. |
| `VETERAN` | Veteran / Veterano | Senior / Sênior | 12,000 XP / pts | High discipline maturity. |
| `MASTER` | Master / Mestre | Executive / Executivo | 25,000 XP / pts | Over 1,600 medium tasks completed. |
| `LEGEND` | Legend / Lenda | High Performance / Alta Performance | 60,000 XP / pts | The ultimate milestone (>1 year of daily discipline). |

---

### ⏱️ Focus Tools: Pomodoro, Stopwatch & Anti-Abuse Rules

While tasks reward the completion of outputs, focus tools reward time immersion (*input*) governed by safeguards against idle mining:

| Mode | Duration / Cycle | Base Reward | Rules & Equivalencies |
| :--- | :---: | :---: | :--- |
| **Short Pomodoro** | 15 to 24 min | **4 XP • 0.10 🪙** | Fast inertia breaker. Requires completed cycle. |
| **Standard Pomodoro** | 25 to 40 min | **8 XP • 0.25 🪙** | The classic standard. Equivalent to slightly over 1 Easy Task. |
| **Deep Work Pomodoro** | > 40 min | **15 XP • 0.50 🪙** | Deep immersion block. Equivalent to 1 Medium Task XP. |
| **Free Stopwatch** | Per 30 min block | **~7 XP • 0.20 🪙** | Continuous proportional reward (capped at 90 min/session). |

#### 🛡️ Anti-Abuse Safeguards
1. **Minimum Session Duration:** Sessions under **10 minutes** grant 0 XP and 0 coins to prevent accidental triggers or artificial farm transactions.
2. **Session Maximum Cap (Anti-AFK):** Any continuous session is capped at **90 minutes** of reward calculation (even if left running for hours).
3. **Daily Diminishing Returns (*Daily Soft Cap*):**
   * **0h to 4h daily (up to 240 min):** 100% of rewards.
   * **4h to 6h daily (240 to 360 min):** 50% of rewards (natural cognitive fatigue zone).
   * **Over 6h daily (> 360 min):** 0% additional XP/coins (minutes are still tracked in statistics, shielding the user from burnout and the economy from inflation).
4. **Leisure Safeguard (Backpack Items):** Running a leisure item from your backpack (e.g. "Play Video Games 30m") yields **strictly ZERO coins and ZERO XP**.

---

## 🛠️ Tech Stack & Architecture

Built with a focus on high scalability, clean domain modeling, and testability:

* **Backend (`habitparty-api`):**
  * **Java 25 & Spring Boot 3.3+**
  * **Hexagonal Architecture (Ports and Adapters)** isolating core business logic and economic math from framework concerns.
  * *Design Patterns:* Strategy (reward & decay calculations), Factory Method (polymorphic tasks), Port-Adapter pattern.
  * **Security & RBAC:** Spring Security with role controls (`ROLE_USER`, `ROLE_ADMIN`), stateless JWT authentication, and BCrypt-hashed credentials.
  * **Social Authentication:** Google OAuth 2.0 integration.
  * **Transactional Emailing:** Resend API for task reminders and account recovery.
  * **Databases:** PostgreSQL (primary relational database) with Flyway database migrations.
  * **Payments & Subscriptions:** Stripe Checkout, Customer Portal, and Webhooks for card subscriptions and Pix.
  * **Documentation:** Swagger / OpenAPI 3.0 visual REST documentation.
* **Frontend (`habitparty-web`):**
  * **Next.js 16 (App Router) & React 19**
  * **Tailwind CSS v4** with semantic design tokens and native light/dark mode support.
  * **Biome** for fast formatting and linting.
  * **Web Audio API** native procedural sound synthesizers (click feedback, timers, and 4 ambient noise generators).
  * **Lucide Icons & Zustand** for lightweight client state management.

---

## 🚀 Getting Started

### Prerequisites
* [Docker & Docker Compose](https://docs.docker.com/get-docker/)
* [Java 25](https://adoptium.net/) (or running via Docker)
* [Node.js 20+](https://nodejs.org/) and npm

---

### 1. Environment Variables Configuration (.env)
Copy the example files and configure your local credentials:

```bash
# Backend
cp habitparty-api/.env.example habitparty-api/.env

# Frontend
cp habitparty-web/.env.example habitparty-web/.env.local
```

---

### 2. Database (PostgreSQL via Docker)
Navigate to the API folder and launch the PostgreSQL container:

```bash
cd habitparty-api
docker compose up -d postgres
```
*(Tip: Running `docker compose up -d postgres` starts solely the database container, keeping port `8080` available for local backend development with Maven. To run both PostgreSQL and the backend API fully containerized, run `docker compose up -d`).*

---

### 3. Backend Server (Spring Boot API)
With PostgreSQL running:

```bash
cd habitparty-api
./mvnw spring-boot:run
```
*(On Windows, use `mvnw.cmd spring-boot:run` or `mvn spring-boot:run`).*

* **Interactive Swagger UI:** `http://localhost:8080/swagger-ui.html`
* **OpenAPI 3.0 Contract:** `http://localhost:8080/v3/api-docs`

---

### 4. Web Frontend (Next.js App)
In a separate terminal, install dependencies and start the dev server:

```bash
cd habitparty-web
npm install
npm run dev
```

* **Web Application:** `http://localhost:3000`
* **Admin Dashboard:** `http://localhost:3000/admin` *(requires account with `ROLE_ADMIN`)*

> 💡 **Developer Notes:** For advanced Docker maintenance commands, terminal environment variable loading, and HTTP client collection tips (Bruno, Postman), see [docs/DEV_NOTES.md](docs/DEV_NOTES.md).

---

## 🗺️ Release Roadmap

### 🎯 Release 1.1 — Internationalization (i18n) & Experience Modes ✅ (Completed)
* **Native Internationalization (i18n):** Full native support for **English (EN)** and **Portuguese (PT-BR)** across all platform views, dialogs, and alerts.
* **Experience Modes (Essential vs. Adventure):** Choose between **Essential Mode (Productivity)** — with Credits, Points (`pts`), Strict Deadline, Inventory, and direct rewards — or **Adventure Mode (RPG Immersion)** — with Gold Coins (🪙), XP, Hardcore Mode, Backpack, and Mystery Boxes.
* **Security & Anti-Bot Protection:** Progressive email verification, IP rate limiting, and robust shields against bot registrations and abuse.
* **Performance & Infrastructure Hardening:** Database table refactoring, high-speed indexes, and accelerated response times on frequent queries.

---

### 🏆 Release 1.2 — Light Theme, Personal Achievements & Public Profiles ✅ (Completed)
* **Light Theme:** Fresh, clean, high-contrast visual mode designed for comfortable daytime productivity and effortless readability.
* **Personal Achievement System:** Milestone badges and trophies automatically unlocked by maintaining streaks, achieving consistency milestones, and earning gold.
* **Achievements Panel:** Dedicated *"My Achievements"* screen to track milestones, trophies, and journey progression.
* **Public Adventurer Profiles:** Shareable profile pages to showcase rank, level progression, and consistency on the platform.
* **Profile Highlights Showcase:** Interactive showcase to organize and highlight your rarest badges (including Founder Member 👑!), titles, and achievements at the top of your profile.

---

### 🛡️ Release 1.3 — Scheduled Events, Bulk History Management & Task-Linked Focus ✅ (Completed)
* **Task-Linked Focus Sessions & Effort Metrics:** Connect Pomodoro/Deep Work timer sessions directly to Kanban tasks in 1 click, track accumulated focus time per card (e.g., `⏱️ 2h 15m focused`), view session history, and auto-complete tasks upon timer completion.
* **To-Dos as Scheduled Events & Duration (VIP):** Transform single-run To-Dos into calendar events with start and end times (`startTime` / `dueEndTime`) or all-day schedules (`isAllDay`), universal date & time selector (`DatePicker`), and live pulsing "In progress" status badges on the Kanban board.
* **Multi-Selection & Batch Delete on Transaction History:** Granular control over the transaction ledger with individual checkboxes, "select all", floating bulk action bar, and batch deletion (`DELETE /transactions/batch`).
* **Kanban Column Snapshots in Ledger:** Preserves the list/column name (`column_name_snapshot`) where the task was completed or failed, protecting historical context even if columns are renamed or deleted.
* **Cross-Workspace Search Hints:** Intelligent search banner that detects matching tasks in other workspaces and lets you switch workspaces with 1 click.
* **Global Time Format Preference (12h AM/PM vs 24h):** User-configurable time format setting in Appearance, seamlessly applied across cards, task details, history, and focus logs.
* **Expanded Task Descriptions (5,000 chars):** Rich task specifications with dynamic character counter and limit alerts.
* **Streak Lost Notifier:** Compassionate, motivational in-app notification when a daily consistency streak is broken.
* **Synchronized Focus & Task Deletion:** Confirmation modals with an option to simultaneously wipe linked ledger transactions when deleting tasks or focus sessions.

---

### ⚔️ Release 1.4 — Parties, VIP Themes, Friendships & Live Chat
* **VIP Atmospheric Themes:** Dynamic color schemes exclusive to Premium subscribers (e.g., *Dark Knight, Cyberpunk Neon, Forest Ranger, Royal Gold*).
* **Friendship Network & Privacy Controls:** Find players via username or friend codes, send invites, build your connected accountability circle, and configure granular privacy controls for your statistics and routines.
* **Party Squads:** Form small accountability groups with friends or study partners using fast invite codes.
* **Cooperative Daily Quests:** Collective daily goals granting coin bonuses and rewards when all squad members complete their commitments.
* **Real-Time Integrated Chat:** Direct messaging between friends and dedicated Party chat rooms to maintain motivation.
* **Activity Notifications:** Elegant audio and visual alerts for incoming messages and friend milestones in real time.

---

### 🏰 Release 2.0 — Guilds & Full Social MMO
* **Thematic Guilds:** Join or found large communities centered around shared ambitions (Academics, Fitness, Coding, Public Exams).
* **Guild Quests & Boss Raids:** Epic cooperative boss battles where world raid bosses lose health as members complete habits and deep work hours.
* **Global Leaderboards:** Competitive ranking ladders for individuals, friend circles, and rival guilds.

---

## 📄 License

**Copyright (c) 2026 Carlos Vinicius / HabitParty. All rights reserved.**

The source code of this project is made publicly available (*"Source-Available"*) for transparency, study, and strictly personal, private use. It is **strictly prohibited** to use, copy, modify, distribute, or host this software for any commercial purpose, monetization, or as a service (SaaS) by third parties.

For complete personal use permissions and restrictions, please consult the [LICENSE](LICENSE) file in the root directory of this repository.
