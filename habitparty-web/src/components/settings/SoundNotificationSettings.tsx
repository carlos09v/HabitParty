"use client";

import {
  Bell,
  Check,
  Crown,
  MousePointerClick,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingToggleRow } from "@/components/settings/SettingToggleRow";
import { Switch } from "@/components/ui/Switch";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useFocusAudioControls } from "@/hooks/useFocusAudioControls";
import type { TimerSoundType } from "@/types/settings";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

interface SoundNotificationSettingsProps {
  isCompact?: boolean;
}

const ALARM_TONE_OPTIONS: readonly {
  id: TimerSoundType;
  label: string;
  description: string;
}[] = [
  {
    id: "zen",
    label: "Sino Zen Suave",
    description: "Harmônico 528Hz focado em calma",
  },
  {
    id: "arcade",
    label: "Arcade Retrô",
    description: "Bips eletrônicos ascendentes gamificados",
  },
] as const;

export function SoundNotificationSettings({
  isCompact = false,
}: SoundNotificationSettingsProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const {
    mounted,
    isPremium,
    uiSoundsEnabled,
    timerSoundsEnabled,
    timerVolume,
    timerSoundType,
    browserNotificationsEnabled,
    notificationPermission,
    ambientSoundType,
    ambientVolume,
    isAmbientPlaying,
    toggleUiSounds,
    toggleTimerSounds,
    setTimerVolume,
    setTimerSoundType,
    toggleBrowserNotifications,
    selectAmbientSound,
    changeAmbientVolume,
  } = useFocusAudioControls({
    onRequirePremiumUpgrade: () => setIsUpgradeModalOpen(true),
  });

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-primary/20 bg-surface/30 backdrop-blur-md animate-pulse",
          isCompact ? "p-4 sm:p-5" : "p-6",
        )}
      >
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const timerVolumePercent = Math.round(timerVolume * 100);
  const ambientVolumePercent = Math.round(ambientVolume * 100);
  const isNotificationActive =
    browserNotificationsEnabled && notificationPermission === "granted";

  return (
    <>
      <SettingsCard
        title="Preferências de Notificações & Sons"
        description="Personalize o feedback auditivo das suas ações no aplicativo, alarmes do Pomodoro e ruídos ambientes de foco."
        icon={<Volume2 className="text-gold" size={20} />}
        isCompact={isCompact}
      >
        <div className="flex flex-col gap-6">
          {/* BLOCO 1: NOTIFICAÇÕES DO NAVEGADOR */}
          <SettingToggleRow
            icon={<Bell size={18} />}
            iconWrapperClassName="bg-magenta/15 text-magenta border-magenta/30"
            title="Notificações de Foco do Navegador"
            description="Receba um aviso na área de trabalho quando uma sessão de foco ou pausa terminar, mesmo em outra aba."
            statusBadge={{
              label:
                notificationPermission === "denied"
                  ? "Bloqueado pelo Navegador"
                  : isNotificationActive
                    ? "Ativado"
                    : "Desativado",
              className: isNotificationActive
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : notificationPermission === "denied"
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-white/5 text-neutral-400 border-white/10",
            }}
            rightControl={
              <Switch
                checked={isNotificationActive}
                onCheckedChange={toggleBrowserNotifications}
                aria-label="Ativar notificações do navegador para término de sessões"
              />
            }
            footer={
              notificationPermission === "denied" ? (
                <p className="text-xs text-red-400/90 pl-12">
                  As notificações estão bloqueadas nas permissões do seu
                  navegador. Para reativar, clique no ícone de cadeado na barra
                  de endereços e permita notificações para o HabitParty.
                </p>
              ) : undefined
            }
          />

          <div className="h-px w-full bg-white/10" />

          {/* BLOCO 2: SONS DE CLIQUE E GAMIFICAÇÃO */}
          <SettingToggleRow
            icon={<MousePointerClick size={18} />}
            iconWrapperClassName="bg-gold/15 text-gold border-gold/30"
            title="Sons de Cliques & Conquistas"
            description="Feedback de áudio ao completar tarefas, avançar hábitos e comprar recompensas."
            statusBadge={{
              label: uiSoundsEnabled ? "Ativado" : "Silenciado",
              className: uiSoundsEnabled
                ? "bg-gold/15 text-gold border-gold/30"
                : "bg-white/5 text-neutral-400 border-white/10",
            }}
            rightControl={
              <Switch
                checked={uiSoundsEnabled}
                onCheckedChange={toggleUiSounds}
                aria-label="Ativar ou silenciar sons de clique e gamificação"
              />
            }
          />

          <div className="h-px w-full bg-white/10" />

          {/* BLOCO 3: ALARMES E VOLUME DO POMODORO */}
          <div className="flex flex-col gap-5">
            <SettingToggleRow
              icon={<Bell size={18} />}
              iconWrapperClassName="bg-primary-dark/40 text-primary-light border-primary/30"
              title="Alarmes do Pomodoro & Pausas"
              description="Tocar sinos sonoros ao iniciar o foco, nas pausas e ao concluir os ciclos."
              statusBadge={{
                label: timerSoundsEnabled ? "Ativado" : "Mudo",
                className: timerSoundsEnabled
                  ? "bg-gold/15 text-gold border-gold/30"
                  : "bg-white/5 text-neutral-400 border-white/10",
              }}
              rightControl={
                <Switch
                  checked={timerSoundsEnabled}
                  onCheckedChange={toggleTimerSounds}
                  aria-label="Ativar ou desativar alarmes do Pomodoro"
                />
              }
            />

            {/* CONTROLE DE VOLUME & TESTE DO POMODORO */}
            <div
              className={cn(
                "rounded-xl border p-4 flex flex-col gap-4 transition-all",
                timerSoundsEnabled
                  ? "bg-white/5 border-white/10"
                  : "opacity-50 pointer-events-none bg-white/2 border-white/5",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {timerVolume === 0 ? (
                    <VolumeX size={18} className="text-neutral-400" />
                  ) : (
                    <Volume2 size={18} className="text-gold" />
                  )}
                  <span className="text-body-s font-bold text-neutral-200">
                    Volume dos Alarmes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gold px-2 py-0.5 bg-gold/15 rounded border border-gold/30">
                    {timerVolumePercent}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      soundEffects.playTimerStartSound(
                        timerSoundType,
                        timerVolume,
                      )
                    }
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gold text-neutral-900 hover:bg-gold-hover transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Sparkles size={13} />
                    Testar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 font-semibold">
                  0%
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={timerVolumePercent}
                  onChange={(e) => setTimerVolume(Number(e.target.value) / 100)}
                  aria-label="Volume do alarme do Pomodoro"
                  className="w-full h-2 rounded-lg bg-surface/80 appearance-none cursor-pointer accent-gold"
                />
                <span className="text-xs text-neutral-400 font-semibold">
                  100%
                </span>
              </div>

              {/* ESTILO DO SOM */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-semibold text-neutral-300">
                  Tom do Alarme:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALARM_TONE_OPTIONS.map((tone) => {
                    const isSelected = timerSoundType === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          setTimerSoundType(tone.id);
                          soundEffects.playTimerStartSound(
                            tone.id,
                            timerVolume,
                          );
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer",
                          isSelected
                            ? "bg-gold/10 border-gold/50 shadow-glow-gold-xs text-neutral-50"
                            : "bg-surface/50 border-white/10 hover:border-white/20 text-neutral-300",
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-100">
                            {tone.label}
                          </span>
                          <span className="text-label-g text-neutral-400">
                            {tone.description}
                          </span>
                        </div>
                        {isSelected && (
                          <Check size={16} className="text-gold shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-white/10" />

          {/* BLOCO 4: SONS DE AMBIENTE PROCEDURAIS (RECURSO VIP) */}
          <div className="flex flex-col gap-5">
            <SettingToggleRow
              icon={<Crown size={18} />}
              iconWrapperClassName="bg-gold/15 text-gold border-gold/30"
              title={
                <>
                  <span>Sons de Foco Ambiente</span>
                  <span className="text-tiny font-black uppercase px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/40">
                    VIP
                  </span>
                </>
              }
              description="Ruídos procedurais e atmosferas relaxantes geradas pelo navegador para bloquear distrações."
              rightControl={
                !isPremium ? (
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover cursor-pointer shrink-0 shadow-xs"
                  >
                    Liberar VIP
                  </button>
                ) : null
              }
            />

            {/* SELEÇÃO E CONTROLE DE VOLUME DO AMBIENTE */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {AMBIENT_SOUND_OPTIONS.map((sound) => {
                  const isSelected = ambientSoundType === sound.id;
                  const isPlaying = isAmbientPlaying && isSelected;
                  const Icon = AMBIENT_ICONS[sound.id];
                  const isLocked = sound.id !== "none" && !isPremium;

                  return (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => selectAmbientSound(sound.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer",
                        isSelected
                          ? "bg-gold/15 border-gold shadow-glow-gold-xs text-gold font-bold"
                          : isLocked
                            ? "bg-surface/30 border-white/5 opacity-70 hover:opacity-100 text-neutral-400"
                            : "bg-surface/50 border-white/10 hover:border-white/20 text-neutral-200",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "p-1.5 rounded-lg shrink-0",
                            isSelected
                              ? "bg-gold text-neutral-950"
                              : "bg-surface text-neutral-300",
                          )}
                        >
                          <Icon size={14} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate">
                            {sound.label}
                          </span>
                          <span className="text-tiny text-neutral-400 truncate">
                            {sound.description}
                          </span>
                        </div>
                      </div>

                      {isPlaying ? (
                        <div className="w-2 h-2 rounded-full bg-gold animate-ping shrink-0" />
                      ) : isSelected ? (
                        <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {isPremium && (
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sliders size={13} className="text-gold" />
                      Volume do Som Ambiente
                    </span>
                    <span className="font-mono font-bold text-gold">
                      {ambientVolumePercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 font-semibold">
                      0%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) =>
                        changeAmbientVolume(parseFloat(e.target.value))
                      }
                      aria-label="Volume padrão do som ambiente"
                      className="w-full h-1.5 bg-primary/40 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                    <span className="text-xs text-neutral-400 font-semibold">
                      100%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingsCard>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
