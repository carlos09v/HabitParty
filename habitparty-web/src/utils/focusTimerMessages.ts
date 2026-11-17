import { getBrowserDocumentLocale } from "@/utils/focusTimerBrowser";

export type StoreTranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

let customStoreT: StoreTranslateFn | null = null;
let customNotificationsT: StoreTranslateFn | null = null;

export function setFocusTimerTranslators(translators: {
  store?: StoreTranslateFn | null;
  notifications?: StoreTranslateFn | null;
}) {
  customStoreT = translators.store ?? null;
  customNotificationsT = translators.notifications ?? null;
}

const FALLBACK_STORE_MESSAGES: Record<
  "en" | "pt-BR",
  Record<string, string>
> = {
  en: {
    breakCompletedToast: "Break completed! Ready for the next focus cycle?",
    longBreakLabel: "long (15 min)",
    shortBreakLabel: "short (5 min)",
    cycleCompletedToast:
      "🍅 Cycle {cycles} completed! Starting {breakLabel} break. Relax a little!",
    overtimeStartedToast:
      "🍅 Cycle goal reached! Counting overtime until you start your break or finish.",
    breakStartedToast:
      "☕ Cycle {cycles} saved! Starting {breakLabel} break. Relax a little!",
    selectTargetToStartToast:
      "Select an activity or backpack item to start focusing.",
    itemAlreadyCompletedToast:
      "🎉 This item has already completed its time. Click the Complete (Check) button to redeem it.",
    breakSkippedToast: "Break skipped. Ready to focus!",
    linkTargetBeforeSaveToast:
      "Link your focus to an activity or backpack item before saving.",
    minDurationWarningToast: "Sessions under 1 minute are not recorded.",
    couponTimeDepletedToast:
      "🎉 Coupon time depleted! Click the Complete (Check) button to redeem it.",
    couponTimeDeductedToast: "Coupon time deducted! (-{time})",
    sessionCompletedRewardsToast:
      "Focus session completed! (+{time} • +{xp} XP • +{coins} 🪙)",
    sessionCompletedLoggedToast: "Focus session completed! (+{time} logged)",
    saveSessionFailedToast: "Failed to save focus session.",
    saveSessionServerErrorToast: "Error saving focus session on the server.",
    couponAlreadyDepletedToast:
      "This coupon's time is already depleted! Click the Complete (Check) button to redeem it.",
    defaultItemName: "Focus Item",
    targetTransferredToast:
      'Target switched to "{name}". The timer keeps running!',
    taskFocusStartedToast: 'Focusing on task "{name}"!',
    taskLinkedToast: 'Task "{name}" linked to focus!',
    completeLinkedTaskAction: "Complete task",
    linkedTaskCompletedToast: 'Task "{name}" marked as completed!',
    linkedTaskCompletedRewardsToast:
      'Task "{name}" completed! (+{xp} XP • +{coins} 🪙)',
    linkedTaskCompletedRewardsToastProductivity:
      'Task "{name}" completed! (+{xp} Points • +{coins} Credits)',
    linkedTaskCompletedNoRewardToast:
      'Task "{name}" marked as completed! (Reward already granted earlier)',
    linkedTaskCompleteFailedToast: "Could not complete the linked task.",
  },
  "pt-BR": {
    breakCompletedToast:
      "Pausa concluída! Pronto para o próximo ciclo de foco?",
    longBreakLabel: "longa (15 min)",
    shortBreakLabel: "curta (5 min)",
    overtimeStartedToast:
      "🍅 Meta do ciclo concluída! Contando o excedente até você iniciar a pausa ou encerrar.",
    breakStartedToast:
      "☕ Ciclo {cycles} salvo! Iniciando pausa {breakLabel}. Relaxe um pouco!",
    selectTargetToStartToast:
      "Selecione uma atividade, tarefa ou item da mochila para iniciar o foco.",
    itemAlreadyCompletedToast:
      "🎉 Este item já concluiu seu tempo. Clique no botão de Concluir (Check) para resgatá-lo.",
    breakSkippedToast: "Pausa pulada. Pronto para focar!",
    linkTargetBeforeSaveToast:
      "Vincule o foco a uma atividade, tarefa ou item da mochila antes de salvar.",
    minDurationWarningToast:
      "Sessões com menos de 1 minuto não são registradas.",
    couponTimeDepletedToast:
      "🎉 Tempo do cupom esgotado! Clique no botão de Concluir (Check) para resgatá-lo.",
    couponTimeDeductedToast: "Tempo do cupom deduzido! (-{time})",
    sessionCompletedRewardsToast:
      "Sessão de foco concluída! (+{time} • +{xp} XP • +{coins} 🪙)",
    sessionCompletedLoggedToast:
      "Sessão de foco concluída! (+{time} registrados)",
    saveSessionFailedToast: "Falha ao salvar sessão de foco.",
    saveSessionServerErrorToast: "Erro ao salvar sessão de foco no servidor.",
    couponAlreadyDepletedToast:
      "O tempo deste cupom já está esgotado! Clique no botão de Concluir (Check) para resgatá-lo.",
    defaultItemName: "Item de Foco",
    targetTransferredToast:
      'Vínculo alterado para "{name}". O tempo continua rodando!',
    taskFocusStartedToast: 'Foco iniciado na tarefa "{name}"!',
    taskLinkedToast: 'Tarefa "{name}" vinculada ao foco!',
    completeLinkedTaskAction: "Concluir tarefa",
    linkedTaskCompletedToast: 'Tarefa "{name}" marcada como concluída!',
    linkedTaskCompletedRewardsToast:
      'Tarefa "{name}" concluída! (+{xp} XP • +{coins} 🪙)',
    linkedTaskCompletedRewardsToastProductivity:
      'Tarefa "{name}" concluída! (+{xp} Pontos • +{coins} Créditos)',
    linkedTaskCompletedNoRewardToast:
      'Tarefa "{name}" marcada como concluída! (Recompensa já concedida anteriormente)',
    linkedTaskCompleteFailedToast:
      "Não foi possível concluir a tarefa vinculada.",
  },
};

const FALLBACK_NOTIFICATION_MESSAGES: Record<
  "en" | "pt-BR",
  Record<string, string>
> = {
  en: {
    breakEndedTitle: "HabitParty - Break Completed!",
    breakEndedBody: "Ready for the next focus cycle?",
    cycleCompletedTitle: "HabitParty - Cycle Completed!",
    cycleCompletedBody:
      "🍅 Cycle {cycles} completed! Starting {breakLabel} break. Relax a little!",
    overtimeStartedTitle: "HabitParty - Cycle Goal Reached!",
    overtimeStartedBody:
      "🍅 Focus goal completed! Counting overtime until you start your break or finish.",
  },
  "pt-BR": {
    breakEndedTitle: "HabitParty - Pausa Concluída!",
    breakEndedBody: "Pronto para o próximo ciclo de foco?",
    cycleCompletedTitle: "HabitParty - Ciclo Concluído!",
    cycleCompletedBody:
      "🍅 Ciclo {cycles} concluído! Iniciando pausa {breakLabel}. Relaxe um pouco!",
    overtimeStartedTitle: "HabitParty - Meta do Ciclo Concluída!",
    overtimeStartedBody:
      "🍅 Meta de foco atingida! Contando o excedente até você iniciar a pausa ou encerrar.",
  },
};

function interpolateFallback(
  template: string,
  values?: Record<string, string | number>,
): string {
  if (!values) return template;
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function tStoreMsg(
  key: string,
  values?: Record<string, string | number>,
): string {
  if (customStoreT) {
    try {
      return customStoreT(key, values);
    } catch {
      // Fallback below
    }
  }
  const dict = FALLBACK_STORE_MESSAGES[getBrowserDocumentLocale()];
  return interpolateFallback(dict[key] ?? key, values);
}

export function tNotifMsg(
  key: string,
  values?: Record<string, string | number>,
): string {
  if (customNotificationsT) {
    try {
      return customNotificationsT(key, values);
    } catch {
      // Fallback below
    }
  }
  const dict = FALLBACK_NOTIFICATION_MESSAGES[getBrowserDocumentLocale()];
  return interpolateFallback(dict[key] ?? key, values);
}
