"use client";

import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import {
  RichTextDescriptionEditor,
  TaskActionControl,
  TaskTagSelector,
} from "@/components/tasks/shared";
import { MAX_TASK_TAGS } from "@/constants/task";
import { useTaskDetailsPopover } from "@/hooks/useTaskDetailsPopover";
import type { TaskDetailsPopoverProps } from "@/types/task-ui";
import { cn } from "@/utils";
import {
  TaskDetailsChecklist,
  TaskDetailsFocusSection,
  TaskDetailsFooter,
  TaskDetailsHeader,
} from "./task-details";

export function TaskDetailsPopover({
  isOpen,
  onClose,
  task,
  columnTitle,
  availableTags = [],
  anchorRect,
  onTaskUpdate,
  onDelete,
  onToggleComplete,
  onHabitChange,
  onEdit,
  onDuplicate,
  onOpenFocusHistory,
}: TaskDetailsPopoverProps) {
  const t = useTranslations("tasks.detailsPopover");
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
    cancelAddItem,
    isHabit,
    isDaily,
    isTodo,
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
    handleAddCheckItem,
    handleToggleCheckItem,
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
    onOpenFocusHistory,
  });

  if (!isOpen || !mounted || !task) return null;

  return createPortal(
    <>
      {/* Backdrop para mobile (< sm) */}
      <div
        className="fixed inset-0 bg-neutral-950/80 z-[119] sm:hidden animate-in fade-in duration-200"
        onClick={handleCloseWithSave}
        aria-hidden="true"
      />

      <div
        ref={popoverRef}
        style={
          isMobileScreen
            ? undefined
            : {
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
              }
        }
        className={cn(
          "fixed z-[120] select-none flex flex-col gap-3 shadow-2xl",
          // Mobile (< sm): Bottom Sheet fixado na base com scroll interno
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:border-primary/40 max-sm:bg-surface max-sm:p-4 max-sm:max-h-[85vh] max-sm:overflow-y-auto max-sm:animate-in max-sm:slide-in-from-bottom max-sm:duration-200",
          // Desktop (sm+): Popover flutuante ancorado
          "sm:w-[390px] sm:max-w-[calc(100vw-24px)] sm:max-h-[calc(100vh-24px)] sm:rounded-2xl sm:border sm:border-primary/40 sm:bg-card dark:sm:bg-popover sm:p-4 sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-150",
        )}
        role="dialog"
        aria-label={t("dialogAria")}
      >
        {/* Pílula visual de puxar para mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/25 mx-auto -mt-1 mb-1 shrink-0" />

        {/* 1. TOPO: Coluna + Tipo / Prazo + Hora + Prioridade + Editar + Fechar */}
        <TaskDetailsHeader
          task={task}
          columnTitle={columnTitle}
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
          onToggleComplete={handleToggleTask}
          onHabitDelta={handleHabitDelta}
          onDateChange={handleDateChange}
          onEventScheduleChange={handleEventScheduleChange}
          onPrioritySelect={handlePrioritySelect}
          onEdit={handleOpenFullModal}
          onClose={handleCloseWithSave}
        />

        {/* 2. ÁREA CENTRAL ROLÁVEL COM CABEÇALHO E RODAPÉ FIXOS */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 max-h-[min(500px,calc(100vh-200px))]">
          {/* HERO: AÇÃO + TÍTULO EDITÁVEL + TAGS */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <TaskActionControl
                task={task}
                isHabit={isHabit}
                isDaily={isDaily}
                completed={completed}
                onToggle={handleToggleTask}
                onDelta={handleHabitDelta}
              />

              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder={t("titlePlaceholder")}
                className={cn(
                  "flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-white/15 focus:border-gold/70 px-1 py-0.5 outline-none transition-colors",
                  "text-base font-bold text-neutral-50 placeholder:text-neutral-500",
                  completed && !isHabit && "line-through text-neutral-400",
                )}
              />
            </div>

            {/* TAGS */}
            <TaskTagSelector
              variant="popover"
              selectedTags={tags}
              availableTags={availableTags}
              isOpen={isAddingTag}
              onOpenChange={(open) =>
                open ? setIsAddingTag(true) : cancelAddTag()
              }
              inputValue={newTagText}
              onInputValueChange={setNewTagText}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              maxTags={MAX_TASK_TAGS}
            />
          </div>

          {/* DESCRIÇÃO WYSIWYG COM TIPTAP */}
          <RichTextDescriptionEditor
            variant="popover"
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
              isAddingItem={isAddingItem}
              newItemText={newItemText}
              onNewItemTextChange={setNewItemText}
              onStartAddItem={() => setIsAddingItem(true)}
              onCancelAddItem={cancelAddItem}
              onAddItem={handleAddCheckItem}
              onToggleItem={handleToggleCheckItem}
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
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={onDuplicate ? handleDuplicateTask : undefined}
          onOpenEdit={handleOpenFullModal}
        />
      </div>
    </>,
    document.body,
  );
}
