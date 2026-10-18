"use client";

import { Coins, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { soundEffects } from "@/utils/soundEffects";
import { DemoDailyCard } from "./demo/DemoDailyCard";
import { DemoFocusCard } from "./demo/DemoFocusCard";
import { DemoHabitCard } from "./demo/DemoHabitCard";
import { DemoPlayerHeader } from "./demo/DemoPlayerHeader";

export function LandingInteractiveDemo() {
  const [xp, setXp] = useState(720);
  const maxXp = 1000;
  const [level, setLevel] = useState(14);
  const [gold, setGold] = useState(380);

  // Estados dos hábitos simulados
  const [waterCount, setWaterCount] = useState(3);
  const [isStudyDone, setIsStudyDone] = useState(false);
  const [studyStreak, setStudyStreak] = useState(5);

  // Estado do mini timer de foco com contagem regressiva ativa
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 25 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Efeito de feedback flutuante
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleWaterPlus = (e: React.MouseEvent) => {
    setWaterCount((prev) => prev + 1);
    const newXp = xp + 15;
    const newGold = gold + 5;
    setGold(newGold);

    if (newXp >= maxXp) {
      setLevel((prev) => prev + 1);
      setXp(newXp - maxXp);
      showToast(`🎉 SUBIU DE NÍVEL! Nível ${level + 1} alcançado!`);
      triggerCelebrationConfetti(e.clientX, e.clientY);
      soundEffects.playTaskCompleteSound();
    } else {
      setXp(newXp);
      showToast("+15 XP • +5 Moedas de Ouro!");
      soundEffects.playHabitSound();
    }
  };

  const handleWaterMinus = () => {
    if (waterCount > 0) {
      setWaterCount((prev) => prev - 1);
      showToast("Hábito decrementado");
    }
  };

  const handleToggleStudy = (e: React.MouseEvent) => {
    if (!isStudyDone) {
      setIsStudyDone(true);
      setStudyStreak((s) => s + 1);
      setGold((g) => g + 25);
      const newXp = xp + 60;

      if (newXp >= maxXp) {
        setLevel((prev) => prev + 1);
        setXp(newXp - maxXp);
        showToast(`🎉 LEVEL UP! Nível ${level + 1}!`);
      } else {
        setXp(newXp);
        showToast("⚔️ Missão Cumprida! +60 XP • +25 Ouro!");
      }

      triggerCelebrationConfetti(e.clientX, e.clientY);
      soundEffects.playTaskCompleteSound();
    } else {
      setIsStudyDone(false);
      setStudyStreak((s) => Math.max(1, s - 1));
      setGold((g) => Math.max(0, g - 25));
      setXp((x) => Math.max(0, x - 60));
      showToast("Missão reaberta");
    }
  };

  const handleToggleTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      soundEffects.playTimerStartSound("zen");
      showToast("⏱️ Modo Hiperfoco Iniciado! Respire fundo.");
    } else {
      setIsTimerRunning(false);
      showToast("Pausa no cronômetro.");
    }
  };

  return (
    <section id="gamificacao" className="py-16 md:py-24 relative scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Demonstração Interativa
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-50 tracking-tight">
            Sinta a satisfação de evoluir na prática.
          </h2>
          <p className="mt-3 text-base text-neutral-300">
            Clique nos botões e tarefas abaixo. No HabitParty, cada esforço real
            gera recompensas imediatas com som, XP e moedas de ouro.
          </p>
        </div>

        {/* Mockup da Janela do App */}
        <div className="relative rounded-2xl bg-card dark:bg-surface/90 border border-neutral-700 dark:border-white/15 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
          {/* Top Bar estilo Sistema Operacional / App Window */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-surface/90 dark:bg-neutral-900/60 border-b border-neutral-700 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger-500/80" />
              <div className="w-3 h-3 rounded-full bg-warning-500/80" />
              <div className="w-3 h-3 rounded-full bg-success-500/80" />
              <span className="ml-2 text-xs font-medium text-neutral-400 hidden sm:inline">
                HabitParty Cosmic Studio • Demonstração ao Vivo
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-neutral-200">
              <span className="flex items-center gap-1 text-gold font-bold">
                <Coins className="w-4 h-4 fill-gold text-gold" />
                {gold} Ouro
              </span>
              <span className="flex items-center gap-1 text-primary-light font-bold">
                <Zap className="w-4 h-4 text-primary-light fill-primary-light" />
                Nível {level}
              </span>
            </div>
          </div>

          {/* Barra de Status do Jogador (XP, Nível e Avatar) */}
          <DemoPlayerHeader level={level} xp={xp} maxXp={maxXp} />

          {/* Grid de Quests e Ações Interativas */}
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 bg-surface/30">
            <DemoHabitCard
              waterCount={waterCount}
              onMinus={handleWaterMinus}
              onPlus={handleWaterPlus}
            />

            <DemoDailyCard
              isStudyDone={isStudyDone}
              studyStreak={studyStreak}
              onToggle={handleToggleStudy}
            />

            <DemoFocusCard
              timerSeconds={timerSeconds}
              isRunning={isTimerRunning}
              onToggleTimer={handleToggleTimer}
            />
          </div>

          {/* Banner inferior dentro da janela */}
          <div className="px-6 py-3.5 bg-surface/90 dark:bg-neutral-900/70 border-t border-neutral-700 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-success-500 animate-ping" />
              <span>
                Simulação interativa: clique nos botões para sentir a sensação
                imediata de recompensa.
              </span>
            </div>
            <span className="text-gold font-semibold">
              No HabitParty: seus hábitos diários viram ouro e evolução de
              verdade ✨
            </span>
          </div>

          {/* Toast de Recompensa Flutuante */}
          {toastMessage && (
            <div className="absolute top-4 right-4 z-30 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="px-4 py-2.5 rounded-xl bg-gold text-neutral-950 font-bold text-xs shadow-glow-gold flex items-center gap-2 border border-yellow-200">
                <Sparkles className="w-4 h-4 fill-neutral-950" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
