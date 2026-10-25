"use client";

import {
  Backpack,
  Check,
  Clock,
  FileText,
  Flame,
  History,
  Hourglass,
  Minus,
  Plus,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  FOCUS_MANUAL_PRESETS,
  getFocusIcon,
  MAX_FOCUS_ACTIVITIES_FREE,
} from "@/constants/focus";
import { useFocusManualRecordForm } from "@/hooks/useFocusManualRecordForm";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { getTodayDateString } from "@/utils/date";
import { getItemRemainingMinutes } from "@/utils/focusFormatters";

interface FocusManualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  records?: FocusRecord[];
  initialActivityId?: string;
  initialItemId?: string;
  onSuccess: () => void;
}

export function FocusManualRecordModal({
  isOpen,
  onClose,
  activities,
  backpackItems,
  records = [],
  initialActivityId,
  initialItemId,
  onSuccess,
}: FocusManualRecordModalProps) {
  const form = useFocusManualRecordForm({
    isOpen,
    activities,
    backpackItems,
    records,
    initialActivityId,
    initialItemId,
    onSuccess,
    onClose,
  });

  const SelectedActivityIcon = form.selectedActivity
    ? getFocusIcon(form.selectedActivity.icon || "book")
    : Target;

  const averageMinutesPerPomo =
    form.completedPomos > 0
      ? Math.floor(form.durationMinutes / form.completedPomos)
      : form.durationMinutes;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      preventClose={form.isSubmitting}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-glow-gold-xs shrink-0">
            <History size={20} />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2">
              Novo Registro de Foco
              <span className="text-tiny uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                Manual
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-normal">
              Lance manualmente uma sessão concluída no seu histórico.
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4 mt-1">
        {/* FORMULÁRIO EM 2 COLUNAS: ESQUERDA (ATIVIDADE/VÍNCULO) E DIREITA (TEMPO/RECOMPENSA) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* ========================================================
              COLUNA 1 (ESQUERDA): O QUE VOCÊ FOCOU?
              ======================================================== */}
          <div className="flex flex-col gap-3.5">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
              <Target size={14} className="text-gold" />
              <span>1. Vínculo e Atividade</span>
            </div>

            {/* Seletor de Vínculo (Atividade vs Mochila) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-body-s text-neutral-200 font-semibold">
                Vincular Sessão
              </span>
              <SegmentedControl
                value={form.targetType}
                onChange={form.handleTargetTypeChange}
                options={[
                  {
                    value: "ACTIVITY",
                    label: "Atividade",
                    icon: Sparkles,
                    badge: form.selectableActivities.length,
                  },
                  {
                    value: "ITEM",
                    label: "Mochila",
                    icon: Backpack,
                    badge: backpackItems.length,
                  },
                ]}
              />
            </div>

            {/* Atividade ou Item */}
            {form.targetType === "ACTIVITY" ? (
              <div className="flex flex-col gap-2">
                <Select
                  id="select-activity"
                  label="Selecione a Atividade"
                  placeholder={
                    form.selectableActivities.length === 0
                      ? "Sem atividades disponíveis."
                      : "Selecione uma atividade"
                  }
                  emptyMessage="Sem atividades disponíveis."
                  value={form.selectedActivityId}
                  onChange={form.handleSelectActivity}
                  options={form.selectableActivities.map((act) => ({
                    value: act.id,
                    label: act.name,
                  }))}
                />

                {form.selectedActivity && (
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/60 border border-primary/20 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                      <SelectedActivityIcon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-neutral-200 font-semibold truncate block">
                        {form.selectedActivity.name}
                      </span>
                    </div>
                    {form.selectedActivity.targetTimeMinutes && (
                      <span className="text-label-g text-neutral-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                        Meta: {form.selectedActivity.targetTimeMinutes}m
                      </span>
                    )}
                  </div>
                )}

                {!form.isPremium &&
                  activities.length > MAX_FOCUS_ACTIVITIES_FREE && (
                    <span className="text-label-g text-gold/90 font-medium px-1 flex items-center gap-1.5">
                      <span>👑</span>
                      <span>
                        {activities.length - MAX_FOCUS_ACTIVITIES_FREE}{" "}
                        atividade(s) pausadas no plano Free.
                      </span>
                    </span>
                  )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Select
                  id="select-item"
                  label="Selecione o Item da Mochila"
                  placeholder={
                    backpackItems.length === 0
                      ? "Sem itens disponíveis."
                      : "Selecione um item da mochila"
                  }
                  emptyMessage="Sem itens disponíveis."
                  value={form.selectedItemId}
                  onChange={form.handleSelectBackpackItem}
                  options={backpackItems.map((item) => {
                    const mins = getItemRemainingMinutes(item.remainingSeconds);
                    return {
                      value: item.inventoryItemId || "",
                      label: `${item.rewardName || "Item de Foco"}${mins > 0 ? ` (${mins}m)` : ""}`,
                    };
                  })}
                />

                {form.selectedItem && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 text-xs">
                    <Clock size={15} className="text-gold shrink-0" />
                    <span className="text-neutral-200">
                      Saldo disponível:{" "}
                      <strong className="text-gold font-bold">
                        {form.selectedItemMinutes} minutos
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Modo Pomodoro ou Cronômetro (quando atividade) */}
            {form.targetType !== "ITEM" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-body-s text-neutral-200 font-semibold flex items-center gap-1.5">
                  <Timer size={14} className="text-gold" />
                  Tipo de Modo
                </span>
                <SegmentedControl
                  value={form.recordType}
                  onChange={form.setRecordType}
                  options={[
                    {
                      value: "POMO",
                      label: "Pomodoro (Ciclos)",
                      icon: Timer,
                    },
                    {
                      value: "STOPWATCH",
                      label: "Cronômetro",
                      icon: Hourglass,
                    },
                  ]}
                />
              </div>
            )}

            {/* Anotações / Observações */}
            <Textarea
              id="record-notes"
              label="Anotações / Observações (opcional)"
              icon={<FileText size={14} />}
              rows={2}
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              placeholder="Ex: Concluído capítulo 4 de Matemática..."
              maxLength={250}
            />
          </div>

          {/* ========================================================
              COLUNA 2 (DIREITA): TEMPO, DATA & RECOMPENSA
              ======================================================== */}
          <div className="flex flex-col gap-3.5">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
              <Clock size={14} className="text-gold" />
              <span>2. Parâmetros da Sessão</span>
            </div>

            {/* Painel de Duração & Ciclos */}
            <div className="p-3 rounded-xl border border-primary/25 bg-primary-dark/15 flex flex-col gap-2.5">
              {form.targetType === "ITEM" ? (
                <div className="flex flex-col gap-1.5">
                  <Input
                    id="duration-minutes"
                    label={`Duração a debitar (${form.selectedItemMinutes}m disponíveis)`}
                    type="number"
                    min={1}
                    max={
                      form.selectedItemMinutes > 0
                        ? form.selectedItemMinutes
                        : undefined
                    }
                    value={form.durationMinutes}
                    onChange={(e) =>
                      form.setDurationMinutes(
                        Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      )
                    }
                    icon={<Clock size={16} className="text-neutral-400" />}
                  />
                  <span className="text-caption text-neutral-400 pl-1">
                    Saldo após registro:{" "}
                    <strong className="text-gold font-semibold">
                      {Math.max(
                        0,
                        form.selectedItemMinutes - form.durationMinutes,
                      )}
                      m
                    </strong>
                  </span>
                </div>
              ) : (
                <>
                  {/* Presets rápidos */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-body-s text-neutral-200 font-semibold flex items-center gap-1.5">
                      <Clock size={14} className="text-gold" />
                      Duração da Sessão
                    </span>
                    <div className="flex items-center gap-1">
                      {FOCUS_MANUAL_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => form.handlePresetSelect(mins)}
                          className={cn(
                            "px-2 py-0.5 rounded text-tiny font-semibold border transition-all cursor-pointer",
                            form.durationMinutes === mins
                              ? "bg-gold/25 border-gold text-gold font-bold shadow-glow-gold-xs"
                              : "bg-surface/60 border-primary/25 text-neutral-400 hover:text-gold hover:border-gold/40",
                          )}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Linha com Duração e Stepper de Ciclos */}
                  <div
                    className={cn(
                      "grid gap-2.5 items-start",
                      form.recordType === "POMO"
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1",
                    )}
                  >
                    <Input
                      id="duration-minutes"
                      label="Minutos Totais"
                      type="number"
                      min={1}
                      max={600}
                      value={form.durationMinutes}
                      onChange={(e) =>
                        form.setDurationMinutes(
                          Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                        )
                      }
                      icon={<Clock size={16} className="text-neutral-400" />}
                    />

                    {form.recordType === "POMO" && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="pomo-stepper"
                          className="font-medium text-neutral-100 select-none text-body-s flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1">
                            <Flame size={13} className="text-gold" />
                            Ciclos
                          </span>
                          <span className="text-caption text-neutral-400 font-normal">
                            ≈ {averageMinutesPerPomo}m/ciclo
                          </span>
                        </label>

                        <div
                          id="pomo-stepper"
                          className="flex items-center justify-between h-11 px-2 rounded-lg border border-neutral-700 bg-card dark:bg-primary-dark/20 dark:border-primary/30"
                        >
                          <button
                            type="button"
                            onClick={() => form.handleCompletedPomosStep(-1)}
                            disabled={form.completedPomos <= 1}
                            className="p-1 rounded-md text-neutral-400 hover:text-gold hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            aria-label="Diminuir ciclos"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="text-body-s font-bold text-neutral-100">
                            {form.completedPomos}{" "}
                            {form.completedPomos === 1 ? "ciclo" : "ciclos"}
                          </span>

                          <button
                            type="button"
                            onClick={() => form.handleCompletedPomosStep(1)}
                            disabled={form.completedPomos >= 50}
                            className="p-1 rounded-md text-neutral-400 hover:text-gold hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            aria-label="Aumentar ciclos"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Seletor de Data Universal HabitParty */}
            <DatePicker
              id="session-date"
              label="Quando ocorreu?"
              value={form.sessionDate}
              onChange={form.setSessionDate}
              maxDate={getTodayDateString()}
              placeholder="Hoje"
              compact
              align="right"
              hint="Início e término são calculados com base na data e duração."
            />

            {/* Estimativa de Recompensa (Oculto por padrão, expansível sob demanda sem scroll vertical) */}
            <div className="pt-1">
              <RewardPreview
                estimate={form.rewardEstimate}
                label="Estimativa de Recompensa"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            RODAPÉ DE AÇÕES DO MODAL
            ======================================================== */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/10 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={form.isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X size={14} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              form.isSubmitting ||
              (form.targetType === "ACTIVITY" && !form.selectedActivityId) ||
              (form.targetType === "ITEM" && !form.selectedItemId)
            }
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {form.isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Salvar Registro</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
