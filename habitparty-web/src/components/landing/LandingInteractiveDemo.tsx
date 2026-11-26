"use client";

import { Gift, RotateCcw, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  type LandingExperienceMode,
  LandingModeSwitcher,
} from "@/components/landing/LandingModeSwitcher";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { LANDING_ANCHORS } from "@/constants/landingAnchors";
import { cn } from "@/utils";
import { DemoDailyCard } from "./demo/DemoDailyCard";
import { DemoFocusCard } from "./demo/DemoFocusCard";
import { DemoHabitCard } from "./demo/DemoHabitCard";
import { DemoPlayerHeader } from "./demo/DemoPlayerHeader";
import { LandingSectionHeader } from "./LandingSectionHeader";

const MAX_XP = 100;
const INITIAL_TOTAL_XP = 14 * MAX_XP + 75;
const INITIAL_GOLD = 10;
const INITIAL_WATER_COUNT = 3;
const INITIAL_STUDY_STREAK = 5;
const DEMO_REWARD_COST = 15;

async function fireDemoConfetti(x?: number, y?: number) {
  const { triggerCelebrationConfetti } = await import("@/utils/confetti");
  triggerCelebrationConfetti(x, y);
}

async function getDemoSoundEffects() {
  const { soundEffects } = await import("@/utils/soundEffects");
  return soundEffects;
}

export function LandingInteractiveDemo() {
  const t = useTranslations("landing.demo");
  const [mode, setMode] = useState<LandingExperienceMode>("adventure");
  const [totalXp, setTotalXp] = useState(INITIAL_TOTAL_XP);
  const [gold, setGold] = useState(INITIAL_GOLD);

  // Ref sincronizada evita stale closure em cliques rápidos consecutivos e na conclusão do timer
  const totalXpRef = useRef(INITIAL_TOTAL_XP);

  // Estados dos hábitos simulados
  const [waterCount, setWaterCount] = useState(INITIAL_WATER_COUNT);
  const [isStudyDone, setIsStudyDone] = useState(false);
  const [studyStreak, setStudyStreak] = useState(INITIAL_STUDY_STREAK);
  const [redeemedCount, setRedeemedCount] = useState(0);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasTimerElapsed, setHasTimerElapsed] = useState(false);
  const [timerResetKey, setTimerResetKey] = useState(0);

  const isEssential = mode === "essential";
  const level = Math.floor(totalXp / MAX_XP);
  const xp = totalXp % MAX_XP;
  const canRedeem = gold >= DEMO_REWARD_COST;
  const missingForReward = Math.max(0, DEMO_REWARD_COST - gold);

  // Efeito de feedback flutuante com limpeza segura de timeout
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2600);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Aplica ganho de XP e moedas atomicamente sobre a ref mais recente,
   * retornando se houve subida de nível para disparar celebração consistente.
   */
  const awardDemoProgress = (xpDelta: number, goldDelta: number) => {
    const prevTotalXp = totalXpRef.current;
    const prevLevel = Math.floor(prevTotalXp / MAX_XP);
    const nextTotalXp = Math.max(0, prevTotalXp + xpDelta);
    const nextLevel = Math.floor(nextTotalXp / MAX_XP);

    totalXpRef.current = nextTotalXp;
    setTotalXp(nextTotalXp);
    setGold((prev) => Math.max(0, prev + goldDelta));

    return {
      leveledUp: nextLevel > prevLevel,
      nextLevel,
    };
  };

  const handleWaterPlus = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    setWaterCount((prev) => prev + 1);
    const { leveledUp, nextLevel } = awardDemoProgress(10, 2);

    if (leveledUp) {
      showToast(t("toasts.habitLevelUp", { level: nextLevel }));
      void fireDemoConfetti(clientX, clientY);
      void getDemoSoundEffects().then((sfx) => sfx.playLevelUpSound());
    } else {
      showToast(
        isEssential
          ? t("toasts.habitScoredEssential")
          : t("toasts.habitScored"),
      );
      void getDemoSoundEffects().then((sfx) => sfx.playHabitSound());
    }
  };

  const handleWaterMinus = () => {
    if (waterCount <= 0) return;
    setWaterCount((prev) => Math.max(0, prev - 1));
    awardDemoProgress(-10, -2);
    showToast(t("toasts.habitDecremented"));
  };

  const handleToggleStudy = (e: React.MouseEvent) => {
    if (!isStudyDone) {
      const { clientX, clientY } = e;
      setIsStudyDone(true);
      setStudyStreak((s) => s + 1);
      const { leveledUp, nextLevel } = awardDemoProgress(30, 5);

      if (leveledUp) {
        showToast(t("toasts.dailyLevelUp", { level: nextLevel }));
        void getDemoSoundEffects().then((sfx) => sfx.playLevelUpSound());
      } else {
        showToast(
          isEssential
            ? t("toasts.dailyCompletedEssential")
            : t("toasts.dailyCompleted"),
        );
        void getDemoSoundEffects().then((sfx) => sfx.playTaskCompleteSound());
      }

      void fireDemoConfetti(clientX, clientY);
    } else {
      setIsStudyDone(false);
      setStudyStreak((s) => Math.max(1, s - 1));
      awardDemoProgress(-30, -5);
      showToast(t("toasts.dailyReopened"));
    }
  };

  const handleToggleTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      void getDemoSoundEffects().then((sfx) => sfx.playTimerStartSound("zen"));
      showToast(t("toasts.timerStarted"));
    } else {
      setIsTimerRunning(false);
      showToast(t("toasts.timerPaused"));
    }
  };

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    const { leveledUp, nextLevel } = awardDemoProgress(25, 3);

    if (leveledUp) {
      showToast(t("toasts.habitLevelUp", { level: nextLevel }));
      void getDemoSoundEffects().then((sfx) => sfx.playLevelUpSound());
    } else {
      showToast(
        isEssential
          ? t("toasts.timerCompletedEssential")
          : t("toasts.timerCompleted"),
      );
      void getDemoSoundEffects().then((sfx) => sfx.playTaskCompleteSound());
    }

    void fireDemoConfetti();
  };

  const handleRedeemReward = (e: React.MouseEvent) => {
    if (!canRedeem) {
      showToast(t("toasts.rewardInsufficient", { missing: missingForReward }));
      return;
    }
    setGold((prev) => Math.max(0, prev - DEMO_REWARD_COST));
    setRedeemedCount((prev) => prev + 1);
    showToast(t("toasts.rewardRedeemed"));
    void fireDemoConfetti(e.clientX, e.clientY);
    void getDemoSoundEffects().then((sfx) => sfx.playBuySound());
  };

  const handleResetDemo = () => {
    totalXpRef.current = INITIAL_TOTAL_XP;
    setTotalXp(INITIAL_TOTAL_XP);
    setGold(INITIAL_GOLD);
    setWaterCount(INITIAL_WATER_COUNT);
    setIsStudyDone(false);
    setStudyStreak(INITIAL_STUDY_STREAK);
    setRedeemedCount(0);
    setIsTimerRunning(false);
    setHasTimerElapsed(false);
    setTimerResetKey((prev) => prev + 1);
    showToast(t("toasts.demoReset"));
  };

  const isDirty =
    totalXp !== INITIAL_TOTAL_XP ||
    gold !== INITIAL_GOLD ||
    waterCount !== INITIAL_WATER_COUNT ||
    isStudyDone ||
    redeemedCount > 0 ||
    isTimerRunning ||
    hasTimerElapsed;

  return (
    <section
      id={LANDING_ANCHORS.gamification}
      className="py-16 md:py-24 relative scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingSectionHeader
          badge={t("badge")}
          badgeIcon={<Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
          badgeClassName="bg-amber-500/10 border-amber-500/30 text-gold-ink dark:bg-gold/10 dark:border-gold/30 dark:text-gold"
          title={t("title")}
          titleClassName="md:text-4xl"
          subtitle={t("subtitle")}
          className="max-w-2xl mb-12"
        />

        {/* Mockup da Janela do App */}
        <div className="relative rounded-2xl bg-card dark:bg-surface/95 border border-neutral-700 dark:border-white/15 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top Bar estilo Sistema Operacional / App Window */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-surface/90 dark:bg-neutral-900/60 border-b border-neutral-700 dark:border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div
                aria-hidden="true"
                className="flex items-center gap-1.5 shrink-0"
              >
                <span className="w-3 h-3 rounded-full bg-danger-500/80" />
                <span className="w-3 h-3 rounded-full bg-warning-500/80" />
                <span className="w-3 h-3 rounded-full bg-success-500/80" />
              </div>
              <span className="ml-1.5 text-xs font-medium text-neutral-400 hidden md:inline truncate">
                {t("windowTitle")}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3.5 shrink-0 text-xs font-medium text-neutral-200">
              {/* Alternador Essencial / Aventura compartilhado */}
              <LandingModeSwitcher
                mode={mode}
                onChange={setMode}
                ariaLabel={t("modeSwitcherLabel")}
                essentialLabel={t("modeEssential")}
                adventureLabel={t("modeAdventure")}
                size="sm"
              />

              <span
                className={cn(
                  "flex items-center gap-1 font-bold tabular-nums",
                  isEssential ? "text-info" : "text-gold-ink dark:text-gold",
                )}
              >
                <CoinIcon size={14} variant={isEssential ? "credit" : "coin"} />
                {isEssential
                  ? t("creditsStatus", { gold })
                  : t("goldStatus", { gold })}
              </span>

              <span className="flex items-center gap-1 text-primary dark:text-primary-light font-bold tabular-nums">
                <Zap
                  className="w-4 h-4 text-primary fill-primary dark:text-primary-light dark:fill-primary-light"
                  aria-hidden="true"
                />
                {t("levelStatus", { level })}
              </span>

              {isDirty && (
                <button
                  type="button"
                  onClick={handleResetDemo}
                  aria-label={t("resetDemoAria")}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-card hover:bg-surface-hover dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-700 dark:border-white/10 text-[11px] font-semibold text-neutral-300 hover:text-neutral-50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("resetDemo")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Status do Jogador */}
          <DemoPlayerHeader
            level={level}
            xp={xp}
            maxXp={MAX_XP}
            isEssential={isEssential}
          />

          {/* Grid de Quests e Ações Interativas */}
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-surface/30">
            <DemoHabitCard
              waterCount={waterCount}
              isEssential={isEssential}
              onMinus={handleWaterMinus}
              onPlus={handleWaterPlus}
            />

            <DemoDailyCard
              isStudyDone={isStudyDone}
              studyStreak={studyStreak}
              isEssential={isEssential}
              onToggle={handleToggleStudy}
            />

            <DemoFocusCard
              key={timerResetKey}
              isRunning={isTimerRunning}
              onToggleTimer={handleToggleTimer}
              onComplete={handleTimerComplete}
              onElapsedChange={setHasTimerElapsed}
            />
          </div>

          {/* Faixa Interativa da Loja de Recompensas (fecha o ciclo na prática) */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 bg-surface/30">
            <div className="p-3.5 sm:p-4 rounded-xl bg-card dark:bg-card/75 border border-neutral-700 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                    isEssential
                      ? "bg-info/12 border-info/30 text-info"
                      : "bg-amber-500/15 border-amber-500/35 text-gold-ink dark:bg-gold/15 dark:border-gold/35 dark:text-gold",
                  )}
                >
                  <Gift className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={cn(
                        "text-tiny font-bold uppercase tracking-wider",
                        isEssential
                          ? "text-info"
                          : "text-gold-ink dark:text-gold",
                      )}
                    >
                      {isEssential
                        ? t("rewardBar.tagEssential")
                        : t("rewardBar.tag")}
                    </span>
                    {redeemedCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-500/15 text-success-400">
                        {t("rewardBar.redeemedCount", { count: redeemedCount })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-50 truncate">
                    {t("rewardBar.title")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-bold tabular-nums",
                    isEssential ? "text-info" : "text-gold-ink dark:text-gold",
                  )}
                >
                  <CoinIcon
                    size={13}
                    variant={isEssential ? "credit" : "coin"}
                  />
                  {isEssential
                    ? t("rewardBar.costEssential", { cost: DEMO_REWARD_COST })
                    : t("rewardBar.costAdventure", { cost: DEMO_REWARD_COST })}
                </span>

                <button
                  type="button"
                  onClick={handleRedeemReward}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-xs font-bold transition-[transform,background-color,border-color,color] active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                    canRedeem
                      ? "bg-gold hover:bg-gold-hover text-on-gold shadow-sm dark:shadow-glow-gold"
                      : "bg-surface text-neutral-300 border border-neutral-700 dark:bg-white/5 dark:border-white/10 hover:border-primary/40",
                  )}
                >
                  {canRedeem
                    ? t("rewardBar.redeemCta")
                    : t("rewardBar.missingHint", { missing: missingForReward })}
                </button>
              </div>
            </div>
          </div>

          {/* Banner inferior dentro da janela */}
          <div className="px-6 py-3.5 bg-surface/90 dark:bg-neutral-900/70 border-t border-neutral-700 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-flex rounded-full h-2.5 w-2.5 bg-primary dark:bg-success-500 ring-4 ring-primary/20 dark:ring-success-500/20 shrink-0"
              />
              <span>{t("footerHint")}</span>
            </div>
            <span className="text-gold-ink dark:text-gold font-semibold">
              {t("footerHighlight")}
            </span>
          </div>

          {/* Toast de Recompensa Flutuante (com aria-live educado) */}
          <div
            aria-live="polite"
            className="absolute top-14 sm:top-4 right-3 sm:right-4 left-3 sm:left-auto max-w-[calc(100%-1.5rem)] sm:max-w-sm z-30 pointer-events-none"
          >
            {toastMessage && (
              <div className="px-4 py-2.5 rounded-xl bg-gold text-on-gold font-bold text-xs shadow-glow-gold flex items-center gap-2 border border-gold-hover/40 dark:border-yellow-200 animate-in fade-in slide-in-from-top-3 duration-300">
                <Sparkles
                  className="w-4 h-4 fill-on-gold shrink-0"
                  aria-hidden="true"
                />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
