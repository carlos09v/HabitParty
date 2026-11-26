import {
  Backpack,
  Crown,
  FileText,
  Hourglass,
  ListTodo,
  Lock,
  Package,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getFocusIcon } from "@/constants/focusIcons";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focusRules";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { formatFocusMinutes } from "@/utils/focusFormatters";

interface FocusManualTargetFieldsProps {
  isGamified: boolean;
  isEditMode: boolean;
  isPremium: boolean;
  totalActivitiesCount: number;
  targetType: "ACTIVITY" | "ITEM";
  onTargetTypeChange: (type: "ACTIVITY" | "ITEM") => void;
  selectableActivities: FocusActivity[];
  selectedActivityId: string;
  selectedActivity?: FocusActivity;
  onSelectActivity: (id: string) => void;
  effectiveFocusableTasks: FocusableTaskItem[];
  selectedTaskId: string;
  onSelectTask: (id: string) => void;
  availableBackpackItems: InventoryItemResponseDTO[];
  selectedItemId: string;
  selectedItem?: InventoryItemResponseDTO;
  selectedItemMinutes: number;
  resolveItemEffectiveMinutes: (itemId: string) => number;
  onSelectBackpackItem: (id: string) => void;
  recordType: FocusRecordType;
  onRecordTypeChange: (type: FocusRecordType) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  targetError?: string;
}

/**
 * Coluna esquerda do modal de registro manual: vínculo (Atividade/Tarefa ou Item),
 * modo da sessão (Pomodoro/Cronômetro) e anotações.
 */
export function FocusManualTargetFields({
  isGamified,
  isEditMode,
  isPremium,
  totalActivitiesCount,
  targetType,
  onTargetTypeChange,
  selectableActivities,
  selectedActivityId,
  selectedActivity,
  onSelectActivity,
  effectiveFocusableTasks,
  selectedTaskId,
  onSelectTask,
  availableBackpackItems,
  selectedItemId,
  selectedItem,
  selectedItemMinutes,
  resolveItemEffectiveMinutes,
  onSelectBackpackItem,
  recordType,
  onRecordTypeChange,
  notes,
  onNotesChange,
  targetError,
}: FocusManualTargetFieldsProps) {
  const t = useTranslations("focus.manualRecord");

  const SelectedActivityIcon = selectedActivity
    ? getFocusIcon(selectedActivity.icon || "book")
    : Target;

  const canLeaveActivityEmpty =
    effectiveFocusableTasks.length > 0 ||
    (isEditMode && (Boolean(selectedTaskId) || !selectedActivityId));

  const activitySelectOptions = (() => {
    const mapped = selectableActivities.map((act) => ({
      value: act.id,
      label: act.name,
    }));
    if (canLeaveActivityEmpty) {
      return [{ value: "", label: t("noActivityLinkedOption") }, ...mapped];
    }
    return mapped;
  })();

  const taskSelectOptions = (() => {
    const sortedTasks = [...effectiveFocusableTasks].sort((a, b) => {
      const completedDiff =
        Number(Boolean(a.completed)) - Number(Boolean(b.completed));
      if (completedDiff !== 0) return completedDiff;
      const focusDiff = (b.totalFocusMinutes ?? 0) - (a.totalFocusMinutes ?? 0);
      if (focusDiff !== 0) return focusDiff;
      return a.title.localeCompare(b.title);
    });

    return [
      { value: "", label: t("noTaskLinkedOption") },
      ...sortedTasks.map((task) => {
        const typeLabel =
          task.type === "daily"
            ? t("taskTypeDailyLabel")
            : t("taskTypeTodoLabel");
        return {
          value: task.id,
          label: task.title,
          group: task.type,
          badge: task.columnTitle || typeLabel,
          meta:
            (task.totalFocusMinutes ?? 0) > 0
              ? formatFocusMinutes(task.totalFocusMinutes ?? 0)
              : undefined,
          keywords: [typeLabel, task.columnTitle, task.workspaceName]
            .filter(Boolean)
            .join(" "),
        };
      }),
    ];
  })();

  const taskFilterTabs = [
    { value: "", label: t("taskFilterAll") },
    { value: "daily", label: t("taskFilterDaily") },
    { value: "todo", label: t("taskFilterTodo") },
  ];

  const itemSelectOptions = availableBackpackItems.map((item) => {
    const itemId = item.inventoryItemId || "";
    const mins = resolveItemEffectiveMinutes(itemId);
    return {
      value: itemId,
      label: `${item.rewardName || t("defaultFocusItemName")}${mins > 0 ? ` (${mins}m)` : ""}`,
    };
  });

  return (
    <div className="flex flex-col gap-3.5 justify-between">
      <div className="flex flex-col gap-3.5">
        {/* Seletor de Vínculo (Atividade vs Mochila) — Travado no modo edição */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-s text-neutral-100 font-medium">
              {t("linkSessionLabel")}
            </span>
            {isEditMode && (
              <Lock
                size={12}
                className="text-neutral-400 shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
          <SegmentedControl
            ariaLabel={t("linkSessionLabel")}
            value={targetType}
            onChange={onTargetTypeChange}
            options={[
              {
                value: "ACTIVITY",
                label: t("activityOption"),
                icon: Sparkles,
                badge: selectableActivities.length,
                disabled: isEditMode && targetType !== "ACTIVITY",
              },
              {
                value: "ITEM",
                label: isGamified ? t("backpackOption") : t("inventoryOption"),
                icon: isGamified ? Backpack : Package,
                badge: availableBackpackItems.length,
                disabled: isEditMode && targetType !== "ITEM",
              },
            ]}
          />
          {isEditMode && (
            <span className="text-tiny text-neutral-400 px-0.5">
              {isGamified
                ? t("linkSessionLockedHint")
                : t("linkSessionLockedHintProductivity")}
            </span>
          )}
        </div>

        {/* Atividade ou Item com <label htmlFor> semântico e badge fora do rótulo */}
        {targetType === "ACTIVITY" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="select-activity"
                className="font-medium text-neutral-100 select-none text-body-s"
              >
                {t("activitySelectLabel")}
              </label>
              {selectedActivity?.targetTimeMinutes && (
                <span className="text-tiny font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 dark:text-gold dark:bg-gold/10 dark:border-gold/25">
                  {t("targetBadge", {
                    minutes: selectedActivity.targetTimeMinutes,
                  })}
                </span>
              )}
            </div>
            <Select
              id="select-activity"
              compact
              icon={<SelectedActivityIcon size={16} aria-hidden="true" />}
              placeholder={
                selectableActivities.length === 0
                  ? t("noActivitiesAvailable")
                  : t("selectActivityPlaceholder")
              }
              emptyMessage={t("noActivitiesAvailable")}
              value={selectedActivityId}
              onChange={onSelectActivity}
              options={activitySelectOptions}
              error={targetError}
            />

            {!isPremium && totalActivitiesCount > MAX_FOCUS_ACTIVITIES_FREE && (
              <span className="text-label-g text-amber-700 dark:text-gold/90 font-medium px-1 flex items-center gap-1.5">
                <Crown size={12} className="shrink-0" aria-hidden="true" />
                <span>
                  {t("pausedFreePlanNotice", {
                    count: totalActivitiesCount - MAX_FOCUS_ACTIVITIES_FREE,
                  })}
                </span>
              </span>
            )}

            {effectiveFocusableTasks.length > 0 && (
              <Select
                id="select-task"
                compact
                searchable
                searchPlaceholder={t("searchTasksPlaceholder")}
                noResultsMessage={t("noTasksMatchingSearch")}
                filterTabs={taskFilterTabs}
                icon={<ListTodo size={16} aria-hidden="true" />}
                label={t("taskSelectLabel")}
                placeholder={t("noTaskLinkedOption")}
                value={selectedTaskId}
                onChange={onSelectTask}
                options={taskSelectOptions}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="select-item"
                className="font-medium text-neutral-100 select-none text-body-s"
              >
                {isGamified
                  ? t("backpackItemSelectLabel")
                  : t("inventoryItemSelectLabel")}
              </label>
              {selectedItem && selectedItemMinutes > 0 && (
                <span className="text-tiny font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 dark:text-gold dark:bg-gold/10 dark:border-gold/25">
                  {t("balanceBadge", { minutes: selectedItemMinutes })}
                </span>
              )}
            </div>
            <Select
              id="select-item"
              compact
              icon={
                isGamified ? (
                  <Backpack size={16} aria-hidden="true" />
                ) : (
                  <Package size={16} aria-hidden="true" />
                )
              }
              placeholder={
                availableBackpackItems.length === 0
                  ? t("noItemsAvailable")
                  : isGamified
                    ? t("selectItemPlaceholder")
                    : t("selectItemPlaceholderProductivity")
              }
              emptyMessage={t("noItemsAvailable")}
              value={selectedItemId}
              onChange={onSelectBackpackItem}
              options={itemSelectOptions}
              error={targetError}
            />
          </div>
        )}

        {/* Modo Pomodoro ou Cronômetro (quando atividade) */}
        {targetType !== "ITEM" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-body-s text-neutral-100 font-medium">
              {t("sessionModeLabel")}
            </span>
            <SegmentedControl
              ariaLabel={t("sessionModeLabel")}
              value={recordType}
              onChange={onRecordTypeChange}
              options={[
                {
                  value: "POMO",
                  label: t("modePomoOption"),
                  icon: Timer,
                },
                {
                  value: "STOPWATCH",
                  label: t("modeStopwatchOption"),
                  icon: Hourglass,
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Anotações / Observações */}
      <Textarea
        id="record-notes"
        label={t("notesLabel")}
        icon={<FileText size={14} aria-hidden="true" />}
        rows={targetType === "ITEM" ? 4 : 2}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder={t("notesPlaceholder")}
        maxLength={500}
      />
    </div>
  );
}
