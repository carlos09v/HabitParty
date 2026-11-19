"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  invalidateFocusDomainTags,
  invalidateRewardDomainTags,
  invalidateShowcaseDomainTags,
  invalidateTaskDomainTags,
} from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import type { WorkspaceResponseDTO } from "@/actions/workspaceActions";
import { serverApi } from "@/api/server";
import {
  buildStarterPackPlan,
  MAX_WORKSPACE_NAME_LENGTH,
} from "@/constants/onboarding";
import {
  getThemePolarity,
  isValidThemeId,
  resolveAllowedTheme,
} from "@/constants/themes";
import {
  type AppLocale,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";
import type { FirstStepCompletionPayload } from "@/types/onboarding";
import type { UserResponseDTO } from "@/types/user";
import { getTodayDateString } from "@/utils/date";

const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Persiste o idioma escolhido.
 *
 * Não chama `revalidatePath` nem exige `router.refresh()` no cliente:
 * setar um cookie dentro de uma Server Action já faz o Next re-renderizar a
 * rota atual (layouts + página) e devolver a nova árvore RSC na MESMA resposta,
 * além de invalidar o Router Cache das demais rotas. Assim a troca de idioma
 * custa uma única ida e volta ao servidor.
 */
export async function setLocaleCookie(locale: AppLocale) {
  const validLocale: AppLocale = isValidLocale(locale) ? locale : "en";
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, validLocale, {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export type CompleteFirstStepResult = ActionState<WorkspaceResponseDTO> & {
  starterPackPartialWarning?: boolean;
};

/**
 * Conclui o onboarding inicial com paralelização máxima e invalidação única de cache:
 * - Cria o primeiro workspace e salva o perfil de onboarding em paralelo;
 * - Persiste os cookies padronizados do app (`activeWorkspaceId`, `theme`, `sitePolarity`, `lastDarkTheme`/`lastLightTheme`);
 * - Cria colunas em paralelo com atividade de foco e recompensas, e semeia tarefas em paralelo ao final.
 */
export async function completeFirstStepOnboardingAction(
  payload: FirstStepCompletionPayload,
): Promise<CompleteFirstStepResult> {
  const workspaceName = payload.workspaceName
    .trim()
    .slice(0, MAX_WORKSPACE_NAME_LENGTH);

  const [tWorkspace, tPresets, workspaceApiRes, userApiRes, cookieStore] =
    await Promise.all([
      getTranslations("onboarding.workspaceActions"),
      !payload.startBlank
        ? getTranslations("onboarding.starterPack.presets")
        : Promise.resolve(null),
      workspaceName.length > 0
        ? serverApi.POST("/workspaces", { body: { name: workspaceName } })
        : Promise.resolve({ data: undefined, error: true as unknown }),
      serverApi.PUT("/users", {
        body: {
          experienceMode: payload.experienceMode,
          usageMode: payload.usageMode,
          ...(isValidThemeId(payload.theme) ? { theme: payload.theme } : {}),
          primaryGoals: payload.primaryGoals,
          mainObstacle: payload.mainObstacle,
          dailyFocusGoalMinutes: payload.dailyFocusGoalMinutes,
          peakPeriod: payload.peakPeriod,
          disciplineStyle: payload.disciplineStyle,
        },
      }),
      cookies(),
    ]);

  const userUpdated = !userApiRes.error;
  const updatedUser = userApiRes.data as UserResponseDTO | undefined;

  if (
    workspaceName.length === 0 ||
    workspaceApiRes.error ||
    !workspaceApiRes.data?.id
  ) {
    if (userUpdated) {
      updateTag("user");
      invalidateShowcaseDomainTags(false);
    }
    return {
      success: false,
      error: getErrorMessage(workspaceApiRes.error, tWorkspace("createError")),
    };
  }

  const createdWorkspace = workspaceApiRes.data as WorkspaceResponseDTO;
  const workspaceId = createdWorkspace.id as string;

  const cookieOptions = {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
  };

  cookieStore.set("activeWorkspaceId", workspaceId, cookieOptions);

  const candidateTheme = updatedUser?.theme ?? payload.theme;
  if (isValidThemeId(candidateTheme)) {
    const resolvedTheme = resolveAllowedTheme(
      candidateTheme,
      Boolean(updatedUser?.isPremium),
    );
    const polarity = getThemePolarity(resolvedTheme);
    cookieStore.set("theme", resolvedTheme, cookieOptions);
    cookieStore.set("sitePolarity", polarity, cookieOptions);
    cookieStore.set(
      polarity === "dark" ? "lastDarkTheme" : "lastLightTheme",
      resolvedTheme,
      cookieOptions,
    );
  }

  let starterPackPartialWarning = false;
  let didSeedFocus = false;
  let didSeedRewards = false;

  if (!payload.startBlank && tPresets) {
    try {
      const plan = buildStarterPackPlan({
        usageMode: payload.usageMode,
        primaryGoals: payload.primaryGoals,
        mainObstacle: payload.mainObstacle,
        dailyFocusGoalMinutes: payload.dailyFocusGoalMinutes,
        peakPeriod: payload.peakPeriod,
        disciplineStyle: payload.disciplineStyle,
      });

      const createColumnsSequentially = async (): Promise<string[]> => {
        if (!payload.starterPack.createColumns) return [];
        const ids: string[] = [];
        for (let idx = 0; idx < plan.columns.length; idx++) {
          const col = plan.columns[idx];
          const colRes = await serverApi.POST("/board_columns", {
            body: {
              workspaceId,
              name: tPresets(`columns.${col.key}`),
              icon: col.icon,
              orderIndex: idx,
            },
          });
          if (colRes.error || !colRes.data?.id) {
            starterPackPartialWarning = true;
          } else {
            ids.push(colRes.data.id);
          }
        }
        return ids;
      };

      const independentPromises: Promise<{ error?: unknown }>[] = [];

      if (payload.starterPack.createFocusActivity) {
        didSeedFocus = true;
        independentPromises.push(
          serverApi.POST("/focus-activities", {
            body: {
              name: tPresets(`focus.${plan.focusActivity.key}`),
              icon: plan.focusActivity.icon,
              recordType: plan.focusActivity.recordType,
              targetTimeMinutes: plan.focusActivity.targetTimeMinutes,
            },
          }),
        );
      }

      if (payload.starterPack.createRewards) {
        didSeedRewards = true;
        for (const rewardPreset of plan.rewards) {
          independentPromises.push(
            serverApi.POST("/rewards", {
              body: {
                name: tPresets(`rewards.${rewardPreset.key}`),
                icon: rewardPreset.icon,
                price: rewardPreset.price,
                category: rewardPreset.category,
                type: rewardPreset.type,
                baseDurationMinutes: rewardPreset.baseDurationMinutes,
              },
            }),
          );
        }
      }

      const [createdColumnIds, ...independentResults] = await Promise.all([
        createColumnsSequentially(),
        ...independentPromises.map((p) =>
          p.catch((err) => ({ error: err ?? true })),
        ),
      ]);

      for (const res of independentResults) {
        if (res.error) {
          starterPackPartialWarning = true;
        }
      }

      if (payload.starterPack.createTasks && createdColumnIds.length > 0) {
        const clientTodayIso = getTodayDateString(
          new Date(),
          payload.clientTimeZone,
        );
        const accountTodayIso = updatedUser?.timezone
          ? getTodayDateString(new Date(), updatedUser.timezone)
          : clientTodayIso;
        const safeDueDateIso =
          clientTodayIso >= accountTodayIso ? clientTodayIso : accountTodayIso;

        const taskResults = await Promise.allSettled(
          plan.tasks.map((taskPreset) => {
            const targetColId =
              createdColumnIds[taskPreset.columnIndex] ?? createdColumnIds[0];
            const isHardcore = Boolean(
              taskPreset.isHardcoreIfStrict &&
                payload.disciplineStyle === "strict",
            );
            return serverApi.POST("/tasks/column/{boardColumnId}", {
              params: { path: { boardColumnId: targetColId } },
              body: {
                name: tPresets(`tasks.${taskPreset.key}`),
                ...(taskPreset.descriptionKey
                  ? {
                      description: tPresets(
                        `taskDescriptions.${taskPreset.descriptionKey}`,
                      ),
                    }
                  : {}),
                ...(taskPreset.priority
                  ? { priority: taskPreset.priority }
                  : {}),
                taskType: taskPreset.taskType,
                difficulty: taskPreset.difficulty,
                isHardcoreModeEnabled: isHardcore,
                ...(taskPreset.taskType === "HABIT"
                  ? {
                      habitType: "POSITIVE" as const,
                      resetCounter: "DAILY" as const,
                      importanceType: taskPreset.importanceType ?? "NORMAL",
                    }
                  : {}),
                ...(taskPreset.taskType === "DAILY"
                  ? {
                      startDate: safeDueDateIso,
                      repeatType: "DAILY" as const,
                      repeatEvery: 1,
                    }
                  : {}),
                ...(taskPreset.taskType === "TODO"
                  ? {
                      dueDate: safeDueDateIso,
                    }
                  : {}),
              },
            });
          }),
        );

        for (const res of taskResults) {
          if (res.status === "rejected" || res.value.error) {
            starterPackPartialWarning = true;
          }
        }
      }
    } catch (err) {
      console.error("[UIAction:StarterPack]", err);
      starterPackPartialWarning = true;
    }
  }

  // Invalidação única agrupada por domínio após concluir todas as criações
  updateTag("workspaces");
  invalidateTaskDomainTags({ includeColumnSummaries: true });
  if (userUpdated) {
    updateTag("user");
    invalidateShowcaseDomainTags(false);
  }
  if (didSeedFocus) {
    invalidateFocusDomainTags({ activities: true });
  }
  if (didSeedRewards) {
    invalidateRewardDomainTags();
  }

  return {
    success: true,
    data: createdWorkspace,
    starterPackPartialWarning,
  };
}
