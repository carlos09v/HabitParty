"use client";

import {
  Check,
  Link2,
  ListTodo,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type MouseEvent, useEffect, useState } from "react";
import { getFocusIcon } from "@/constants/focus";
import { AMBIENT_ICONS } from "@/constants/settings";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { cn } from "@/utils";
import { formatFocusDisplayTime } from "@/utils/focusFormatters";
import { getRewardIcon } from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

export function SidebarFocusWidget() {
  const router = useRouter();
  const t = useTranslations("focusWidget");
  const [mounted, setMounted] = useState(false);

  // Estados do Timer
  const isActive = useFocusTimerStore((s) => s.isActive);
  const isPaused = useFocusTimerStore((s) => s.isPaused);
  const mode = useFocusTimerStore((s) => s.mode);
  const secondsRemaining = useFocusTimerStore((s) => s.secondsRemaining);
  const elapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);
  const target = useFocusTimerStore((s) => s.target);

  const toggleTimer = useFocusTimerStore((s) => s.toggleTimer);
  const resetTimer = useFocusTimerStore((s) => s.resetTimer);
  const completeSession = useFocusTimerStore((s) => s.completeSession);

  // Estados de Som Ambiente
  const ambientSoundType = useSoundPreferencesStore((s) => s.ambientSoundType);
  const isAmbientPlaying = useSoundPreferencesStore((s) => s.isAmbientPlaying);
  const setAmbientSoundType = useSoundPreferencesStore(
    (s) => s.setAmbientSoundType,
  );
  const setIsAmbientPlaying = useSoundPreferencesStore(
    (s) => s.setIsAmbientPlaying,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasActiveTimer = (isActive || elapsedSeconds > 0) && Boolean(target);
  const hasActiveAmbient = isAmbientPlaying && ambientSoundType !== "none";

  // Se não houver timer ativo E nenhum som de ambiente ligado, oculta o widget
  if (!hasActiveTimer && !hasActiveAmbient) {
    return null;
  }

  const handleStopAmbient = (e: MouseEvent) => {
    e.stopPropagation();
    soundEffects.stopAmbientSound();
    setAmbientSoundType("none");
    setIsAmbientPlaying(false);
  };

  const handleCardClick = () => {
    router.push("/focus");
  };

  const AmbientIcon = AMBIENT_ICONS[ambientSoundType] || Volume2;
  const ambientLabel =
    ambientSoundType === "rain" ||
    ambientSoundType === "cafe" ||
    ambientSoundType === "fire" ||
    ambientSoundType === "lofi" ||
    ambientSoundType === "none"
      ? t(`ambientSounds.${ambientSoundType}`)
      : t("ambientSounds.default");

  // CASO 1: Apenas Som Ambiente Ativo (sem timer)
  if (!hasActiveTimer && hasActiveAmbient) {
    return (
      <article
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        title={t("activeAmbientTitle")}
        aria-label={t("activeAmbientAria")}
        className="group relative flex flex-col gap-1.5 p-2 rounded-lg border border-gold/60 bg-gold/10 hover:border-gold hover:bg-gold/15 transition-colors cursor-pointer select-none text-left shadow-glow-gold-xs mb-2.5"
      >
        <div className="flex items-center justify-between gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-gold/50 bg-gold/20 text-gold animate-pulse">
              <AmbientIcon size={12} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-g font-bold text-neutral-100 group-hover:text-gold transition-colors truncate">
                {ambientLabel}
              </span>
              <span className="text-label-m text-amber-800 dark:text-gold/90 font-medium leading-none">
                {t("activeFocusSound")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-label-s px-1 py-0.5 rounded font-semibold uppercase tracking-wider bg-gold/20 text-gold border border-gold/40">
              VIP
            </span>
            <button
              type="button"
              onClick={handleStopAmbient}
              title={t("turnOffAmbient")}
              aria-label={t("turnOffAmbient")}
              className="w-5 h-5 rounded flex items-center justify-center border border-primary/30 bg-surface/80 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors cursor-pointer shadow-xs ml-0.5"
            >
              <VolumeX size={10} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  // CASO 2: Timer Ativo (com ou sem Som Ambiente)
  const isRunning = isActive && !isPaused;
  const isInventory = target?.type === "inventory";
  const TargetIcon =
    target?.type === "task"
      ? ListTodo
      : isInventory
        ? getRewardIcon(target?.icon, "TimeBased")
        : target?.icon
          ? getFocusIcon(target.icon)
          : Timer;

  const displayTime = formatFocusDisplayTime({
    mode,
    secondsRemaining,
    elapsedSeconds,
    target,
  });

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      title={t("activeSessionTitle")}
      aria-label={t("activeSessionAria")}
      className={cn(
        "group relative flex flex-col gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer select-none text-left shadow-xs mb-2.5",
        isRunning
          ? "border-amber-500/60 bg-amber-500/10 hover:border-amber-500 hover:bg-amber-500/15 dark:border-gold/70 dark:bg-gold/10 dark:hover:border-gold dark:hover:bg-gold/15 shadow-glow-gold-xs"
          : "border-primary/25 bg-surface/70 hover:border-primary/45 hover:bg-surface/90 dark:border-primary/40 dark:hover:border-gold/40",
      )}
    >
      {/* Linha Superior: Ícone, Nome e Badge */}
      <div className="flex items-center justify-between gap-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors",
              isRunning
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:bg-gold/20 dark:border-gold/50 dark:text-gold animate-pulse"
                : "bg-primary-dark/40 border-primary/30 text-neutral-300",
            )}
          >
            <TargetIcon size={11} />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label-g font-bold text-neutral-100 group-hover:text-primary dark:group-hover:text-gold transition-colors truncate">
              {target?.name || t("defaultModeName")}
            </span>
            {target?.type === "activity" && target.taskName && (
              <span className="text-label-s text-neutral-400 truncate leading-tight">
                {target.taskName}
              </span>
            )}
          </div>
        </div>

        <span
          className={cn(
            "text-label-s px-1 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wider",
            isInventory
              ? "bg-amber-500/15 text-amber-800 border border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
              : mode === "POMO"
                ? "bg-amber-500/15 text-amber-800 border border-amber-500/35 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                : "bg-surface border border-neutral-600 dark:border-primary/40 text-neutral-300",
          )}
        >
          {isInventory
            ? t("modeBackpack")
            : mode === "POMO"
              ? t("modePomodoro")
              : t("modeStopwatch")}
        </span>
      </div>

      {/* Badge clicável para vincular atividade quando o foco foi iniciado direto pela tarefa */}
      {target?.type === "task" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/focus?linkActivity=true");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
            }
          }}
          title={t("linkActivityTitle")}
          className="inline-flex items-center gap-1 self-start max-w-full px-1.5 py-0.5 rounded-md border border-primary/35 bg-primary/15 hover:bg-primary/25 text-primary-light dark:border-gold/40 dark:bg-gold/12 dark:hover:bg-gold/22 dark:text-gold text-label-s font-semibold transition-colors cursor-pointer"
        >
          <Link2 size={10} className="shrink-0" />
          <span className="truncate">{t("linkActivityBadge")}</span>
        </button>
      )}

      {/* Linha Central: Mostrador do Tempo e Status */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "font-mono font-black text-xs tracking-tight transition-colors",
              isRunning ? "text-amber-700 dark:text-gold" : "text-neutral-200",
            )}
          >
            {displayTime}
          </span>
          {isRunning && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-gold inline-block shrink-0" />
          )}
        </div>

        {/* Controles Rápidos do Timer */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
            title={isRunning ? t("pauseTitle") : t("resumeTitle")}
            aria-label={isRunning ? t("pauseAria") : t("resumeAria")}
            className={cn(
              "w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer shadow-xs",
              isRunning
                ? "bg-gold text-on-gold border-gold hover:bg-gold-hover"
                : "bg-surface hover:bg-primary/15 text-neutral-200 hover:text-primary border-neutral-600 dark:hover:bg-gold/20 dark:hover:text-gold dark:border-primary/30",
            )}
          >
            {isRunning ? (
              <Pause size={10} className="fill-current" />
            ) : (
              <Play size={10} className="fill-current ml-0.5" />
            )}
          </button>

          {/* Concluir / Salvar */}
          {elapsedSeconds >= 60 && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await completeSession();
              }}
              title={
                mode === "POMO" && secondsRemaining > 0 && !isInventory
                  ? t("savePartialTitle")
                  : t("completeSaveTitle")
              }
              aria-label={
                mode === "POMO" && secondsRemaining > 0 && !isInventory
                  ? t("savePartialAria")
                  : t("completeSaveAria")
              }
              className="w-5 h-5 rounded flex items-center justify-center border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 hover:border-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30 dark:hover:border-emerald-400 transition-colors cursor-pointer shadow-xs"
            >
              <Check size={10} className="stroke-[2.5]" />
            </button>
          )}

          {/* Reset / Parar */}
          {isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetTimer();
              }}
              title={t("stopResetTitle")}
              aria-label={t("stopAria")}
              className="w-5 h-5 rounded flex items-center justify-center border border-primary/30 bg-surface/80 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Linha Inferior Opcional: Som Ambiente Ativo Integrado com Mute Rápido */}
      {hasActiveAmbient && (
        <div className="flex items-center justify-between pt-1 border-t border-primary/20 text-tiny text-neutral-300">
          <div className="flex items-center gap-1 truncate min-w-0">
            <AmbientIcon
              size={11}
              className="text-gold shrink-0 animate-pulse"
            />
            <span className="truncate text-amber-800 dark:text-gold/90">
              {ambientLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={handleStopAmbient}
            title={t("turnOffAmbient")}
            aria-label={t("turnOffAmbient")}
            className="flex items-center gap-0.5 text-neutral-400 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer shrink-0"
          >
            <VolumeX size={10} />
            <span className="text-label-m">{t("stopLabel")}</span>
          </button>
        </div>
      )}
    </article>
  );
}
