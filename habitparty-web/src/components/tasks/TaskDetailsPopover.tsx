"use client";

import { Crown, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { TaskActionControl, TaskTagSelector } from "@/components/tasks/shared";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { MAX_TASK_TAGS, TASK_TITLE_MAX_LENGTH } from "@/constants/task";
import { useTaskDetailsPopover } from "@/hooks/useTaskDetailsPopover";
import { useUIStore } from "@/store/uiStore";
import type { TaskDetailsPopoverProps } from "@/types/task-ui";
import { cn } from "@/utils";
import {
  TaskDetailsChecklist,
  TaskDetailsFocusSection,
  TaskDetailsFooter,
  TaskDetailsHeader,
} from "./task-details";

const RichTextDescriptionEditor = dynamic(
  () =>
    import("@/components/tasks/shared/RichTextDescriptionEditor").then(
      (mod) => ({ default: mod.RichTextDescriptionEditor }),
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[104px] rounded-xl border border-neutral-700/60 bg-surface/40 animate-pulse"
        aria-hidden="true"
      />
    ),
  },
);

export function TaskDetailsPopover({
  isOpen,
  onClose,
  task,
  columnTitle,
  workspaceName,
  availableTags = [],
  anchorRect,
  onTaskUpdate,
  onDelete,
  onToggleComplete,
  onHabitChange,
  onEdit,
  onDuplicate,
  isDuplicating = false,
  isReadOnly = false,
  onOpenFocusHistory,
}: TaskDetailsPopoverProps) {
  const t = useTranslations("tasks.detailsPopover");
  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);
  const {
    mounted,
    popoverRef,
    titleInputRef,
    isMobileScreen,
    popoverPosition,
    completed,
    title,
    setTitle,
    description,
    setDescription,
    descriptionFlushRef,
    dueDate,
    dueTime,
    startTime,
    dueEndTime,
    isAllDay,
    priority,
    tags,
    isAddingTag,
    setIsAddingTag,
    newTagText,
    setNewTagText,
    cancelAddTag,
    checklist,
    isAddingItem,
    setIsAddingItem,
    newItemText,
    setNewItemText,
    isNewItemRewarded,
    setIsNewItemRewarded,
    cancelAddItem,
    isHabit,
    isDaily,
    isTodo,
    canRewardChecklistItems,
    handleCloseWithSave,
    handleToggleTask,
    handleHabitDelta,
    handleTitleBlur,
    handleTitleKeyDown,
    handleDescriptionBlur,
    handleDateChange,
    handleEventScheduleChange,
    handlePrioritySelect,
    handleAddTag,
    handleRemoveTag,
    handleUpdateTag,
    handleAddCheckItem,
    handleToggleCheckItem,
    handleToggleCheckItemReward,
    handleUpdateCheckItem,
    handleDeleteCheckItem,
    handleDeleteTask,
    handleDuplicateTask,
    handleOpenFullModal,
    handleOpenFocusHistory,
  } = useTaskDetailsPopover({
    isOpen,
    onClose,
    task,
    anchorRect,
    onTaskUpdate,
    onDelete,
    onToggleComplete,
    onHabitChange,
    onEdit,
    onDuplicate,
    isReadOnly,
    onOpenFocusHistory,
  });

  if (!isOpen || !mounted || !task) return null;

  return createPortal(
    <>
      {/* Backdrop para mobile (< sm) — fechamento já gerenciado por useClickOutside (evita duplo disparo) */}
      <div
        className="fixed inset-0 bg-neutral-950/80 z-[119] sm:hidden animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <div
        ref={popoverRef}
        tabIndex={-1}
        style={
          isMobileScreen
            ? undefined
            : {
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
              }
        }
        className={cn(
          "fixed z-[120] select-none flex flex-col gap-3 shadow-2xl focus:outline-none",
          // Mobile (< sm): Bottom Sheet fixado na base com scroll único interno
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:border-primary/40 max-sm:bg-card dark:max-sm:bg-popover max-sm:p-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:max-h-[85dvh] max-sm:overflow-hidden max-sm:overscroll-contain max-sm:animate-in max-sm:slide-in-from-bottom max-sm:duration-200",
          // Desktop (sm+): Popover flutuante ancorado
          "sm:w-[390px] sm:max-w-[calc(100vw-24px)] sm:max-h-[calc(100dvh-24px)] sm:rounded-2xl sm:border sm:border-primary/40 sm:bg-card dark:sm:bg-popover sm:p-4 sm:animate-in sm:zoom-in-95 sm:duration-150",
        )}
        role="dialog"
        aria-modal={isMobileScreen ? true : undefined}
        aria-label={t("dialogAria")}
      >
        {/* Pílula visual de puxar para mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/25 mx-auto -mt-1 mb-1 shrink-0" />

        {/* 1. TOPO: Coluna + Tipo / Prazo + Hora + Prioridade + Editar + Fechar */}
        <TaskDetailsHeader
          task={task}
          columnTitle={columnTitle}
          workspaceName={workspaceName}
          completed={completed}
          isHabit={isHabit}
          isDaily={isDaily}
          isTodo={isTodo}
          dueDate={dueDate}
          dueTime={dueTime}
          startTime={startTime}
          dueEndTime={dueEndTime}
          isAllDay={isAllDay}
          priority={priority}
          isReadOnly={isReadOnly}
          onDateChange={handleDateChange}
          onEventScheduleChange={handleEventScheduleChange}
          onPrioritySelect={handlePrioritySelect}
          onEdit={isReadOnly ? undefined : handleOpenFullModal}
          onClose={handleCloseWithSave}
        />

        {isReadOnly && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 dark:bg-gold/10 border border-amber-500/35 dark:border-gold/30 text-tiny text-amber-800 dark:text-gold">
            <span className="flex items-center gap-1.5 min-w-0 font-semibold">
              <Lock size={12} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{t("readOnlyNotice")}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                openUpgradeModal();
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold text-on-gold font-bold hover:bg-gold-hover transition-colors shrink-0 cursor-pointer"
            >
              <Crown size={11} aria-hidden="true" />
              <span>{t("readOnlyUpgradeCta")}</span>
            </button>
          </div>
        )}

        {/* 2. ÁREA CENTRAL ROLÁVEL COM CABEÇALHO E RODAPÉ FIXOS */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 sm:max-h-[min(500px,calc(100dvh-200px))]">
          {/* HERO: AÇÃO + TÍTULO EDITÁVEL + TAGS */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <TaskActionControl
                task={task}
                isHabit={isHabit}
                isDaily={isDaily}
                completed={completed}
                disabled={isReadOnly}
                onToggle={handleToggleTask}
                onDelta={handleHabitDelta}
              />

              <input
                ref={titleInputRef}
                type="text"
                aria-label={t("titleInputAria")}
                value={title}
                disabled={isReadOnly}
                maxLength={TASK_TITLE_MAX_LENGTH}
                onChange={(e) =>
                  setTitle(e.target.value.slice(0, TASK_TITLE_MAX_LENGTH))
                }
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder={t("titlePlaceholder")}
                className={cn(
                  "flex-1 min-w-0 select-text bg-transparent border-b border-transparent px-1 py-0.5 outline-none transition-colors",
                  !isReadOnly && "hover:border-white/15 focus:border-gold/70",
                  isReadOnly && "opacity-85 cursor-default",
                  "text-base font-bold text-neutral-50 placeholder:text-neutral-500",
                  completed && !isHabit && "line-through text-neutral-400",
                )}
              />
              {!isReadOnly && (
                <DescriptionCharCounter
                  length={title.length}
                  max={TASK_TITLE_MAX_LENGTH}
                  className="shrink-0 self-center"
                />
              )}
            </div>

            {/* TAGS */}
            <TaskTagSelector
              variant="popover"
              disabled={isReadOnly}
              selectedTags={tags}
              availableTags={availableTags}
              isOpen={isAddingTag}
              onOpenChange={(open) =>
                open && !isReadOnly ? setIsAddingTag(true) : cancelAddTag()
              }
              inputValue={newTagText}
              onInputValueChange={setNewTagText}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onUpdateTag={handleUpdateTag}
              maxTags={MAX_TASK_TAGS}
            />
          </div>

          {/* DESCRIÇÃO WYSIWYG COM TIPTAP */}
          <RichTextDescriptionEditor
            variant="popover"
            disabled={isReadOnly}
            value={description}
            onChange={setDescription}
            flushRef={descriptionFlushRef}
            onBlur={handleDescriptionBlur}
            placeholder={t("descriptionPlaceholder")}
            headerLabel={t("descriptionLabel")}
            doneLabel={t("doneEditing")}
          />

          {/* CHECKLIST / SUBTAREFAS */}
          {!isHabit && (
            <TaskDetailsChecklist
              checklist={checklist}
              disabled={isReadOnly}
              canReward={canRewardChecklistItems}
              isTaskCompleted={completed}
              isAddingItem={isAddingItem}
              newItemText={newItemText}
              onNewItemTextChange={setNewItemText}
              isNewItemRewarded={isNewItemRewarded}
              onNewItemRewardedChange={setIsNewItemRewarded}
              onStartAddItem={() => {
                if (!isReadOnly) setIsAddingItem(true);
              }}
              onCancelAddItem={cancelAddItem}
              onAddItem={handleAddCheckItem}
              onToggleItem={handleToggleCheckItem}
              onToggleReward={handleToggleCheckItemReward}
              onUpdateItem={handleUpdateCheckItem}
              onDeleteItem={handleDeleteCheckItem}
            />
          )}

          {/* SESSÃO DE FOCO & HISTÓRICO DE ESFORÇO DA TAREFA */}
          {!isHabit && (
            <TaskDetailsFocusSection
              task={task}
              currentTitle={title}
              completed={completed}
              isReadOnly={isReadOnly}
              onOpenFocusHistory={
                onOpenFocusHistory ? handleOpenFocusHistory : undefined
              }
            />
          )}
        </div>

        {/* 3. RODAPÉ */}
        <TaskDetailsFooter
          task={task}
          columnTitle={columnTitle}
          isReadOnly={isReadOnly}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={
            onDuplicate && !isReadOnly ? handleDuplicateTask : undefined
          }
          isDuplicating={isDuplicating}
          onOpenEdit={isReadOnly ? undefined : handleOpenFullModal}
        />
      </div>
    </>,
    document.body,
  );
}
