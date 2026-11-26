import { useDashboardFilterStore } from "@/store/dashboardFilterStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import { useWelcomeCardsStore } from "@/store/welcomeCardsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { UserResponseDTO } from "@/types/user";

const STREAK_TRACKER_STORAGE_PREFIX = "habitparty_streak_tracker_";

export type ClientAccountCleanupMode =
  | {
      kind: "delete";
    }
  | {
      kind: "reset";
      resetUser: UserResponseDTO;
      resetWorkspacesAndFocus: boolean;
    };

/**
 * Limpa stores cliente e entradas de localStorage ao redefinir ou excluir a conta.
 */
export function clearClientAccountState(mode: ClientAccountCleanupMode): void {
  useOptimisticDashboardStore.getState().clear();
  useDashboardFilterStore.getState().resetAll();

  if (mode.kind === "delete") {
    useUserStore.getState().clearUserSession();
    useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: null });
    useFocusTimerStore.getState().resetTarget();
    useWelcomeCardsStore.getState().showAllCards();

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("habitparty")) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignora ambientes sem acesso ao localStorage
    }
    return;
  }

  const userStore = useUserStore.getState();
  userStore.setUser(mode.resetUser);
  userStore.setLastStreakSecuredDate(null);
  userStore.resetAchievementSession();
  if (!mode.resetWorkspacesAndFocus) {
    userStore.triggerAchievementCheck();
  }

  try {
    if (mode.resetUser.id) {
      localStorage.removeItem(
        `${STREAK_TRACKER_STORAGE_PREFIX}${mode.resetUser.id}`,
      );
    }
  } catch {
    // Ignora ambientes sem acesso ao localStorage
  }

  if (mode.resetWorkspacesAndFocus) {
    useWorkspaceStore.setState({
      workspaces: [],
      activeWorkspaceId: null,
    });
    useFocusTimerStore.getState().resetTarget();
  }
}
