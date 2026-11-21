import { DEFAULT_POMO_MINUTES } from "@/constants/focus";
import type { TimerSoundType } from "@/store/soundPreferencesStore";
import type {
  FocusActivity,
  FocusPhase,
  FocusRecordType,
  FocusTimerState,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";

export interface FocusTimerStoreState extends FocusTimerState {
  phase: FocusPhase;
  lastTickTimestamp: number | null;
  hasTriggeredOvertimeAlert: boolean;
  isSavingSession: boolean;
  isCompletingLinkedTask: boolean;
  onSessionSavedCallback: (() => void) | null;

  // Preferências de Som (delegadas para SoundPreferencesStore)
  toggleSound: () => void;
  setTimerSoundType: (type: TimerSoundType) => void;

  // Notas da Sessão Atual (não persistem após reset/conclusão)
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;

  // Actions
  setOnSessionSavedCallback: (cb: (() => void) | null) => void;
  toggleTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopFromWidget: () => void;
  skipBreak: () => void;
  startBreak: () => Promise<boolean>;
  completeSession: (
    notes?: string,
    options?: {
      suppressCompleteSound?: boolean;
      suppressLinkedTaskAction?: boolean;
      suppressSuccessToast?: boolean;
    },
  ) => Promise<boolean>;
  changeMode: (newMode: FocusRecordType) => void;
  changeDuration: (minutes: number) => void;
  startFocusActivity: (activity: FocusActivity) => void;
  startFocusItem: (item: InventoryItemResponseDTO) => void;
  startFocusTask: (task: { id: string; title: string }) => void;
  selectActivityTarget: (activity: FocusActivity | null) => void;
  selectItemTarget: (item: InventoryItemResponseDTO | null) => void;
  selectTaskTarget: (task: { id: string; title: string } | null) => void;
  unlinkTaskFromTarget: () => void;
  completeLinkedTask: (taskId: string, taskName?: string) => Promise<boolean>;
  syncTargetMetadata: (metadata: {
    id?: string;
    name?: string;
    icon?: string;
    targetMinutes?: number;
    recordType?: FocusRecordType;
    taskId?: string;
    taskName?: string;
  }) => void;
  resetTarget: () => void;
  transferTarget: (activity: FocusActivity) => void;
  // Vincula uma Atividade macro a uma sessão cujo alvo atual é uma Tarefa
  linkActivityToTask: (activity: FocusActivity) => void;
  tick: () => void;
}

export type FocusStoreSetter = (
  partial:
    | FocusTimerStoreState
    | Partial<FocusTimerStoreState>
    | ((
        state: FocusTimerStoreState,
      ) => FocusTimerStoreState | Partial<FocusTimerStoreState>),
) => void;

export type FocusStoreGetter = () => FocusTimerStoreState;

/**
 * Helper unificado para gerar o estado base de timer parado/resetado,
 * evitando repetição dos mesmos campos em múltiplos métodos da store.
 */
export function buildIdleTimerPatch(
  durationSeconds = DEFAULT_POMO_MINUTES * 60,
  overrides?: Partial<FocusTimerStoreState>,
): Partial<FocusTimerStoreState> {
  return {
    isActive: false,
    isPaused: false,
    phase: "WORK",
    secondsRemaining: durationSeconds,
    totalDurationSeconds: durationSeconds,
    elapsedSeconds: 0,
    startedAt: null,
    lastTickTimestamp: null,
    hasTriggeredOvertimeAlert: false,
    ...overrides,
  };
}
