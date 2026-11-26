"use client";

import { History, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { FocusManualScheduleFields } from "@/components/focus/modals/FocusManualScheduleFields";
import { FocusManualTargetFields } from "@/components/focus/modals/FocusManualTargetFields";
import { FocusModalFooter } from "@/components/focus/modals/FocusModalFooter";
import { BaseModal } from "@/components/ui/BaseModal";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusManualRecordForm } from "@/hooks/useFocusManualRecordForm";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecord,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";

interface FocusManualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  allInventoryItems?: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  records?: FocusRecord[];
  editingRecord?: FocusRecord | null;
  initialActivityId?: string;
  initialItemId?: string;
  initialTaskId?: string;
  onSuccess?: () => void;
  onRecordUpdated?: (updatedRecord: FocusRecord) => void;
}

export function FocusManualRecordModal(props: FocusManualRecordModalProps) {
  if (!props.isOpen) return null;

  const formKey = props.editingRecord
    ? `edit-${props.editingRecord.id}`
    : `new-${props.initialActivityId ?? ""}-${props.initialItemId ?? ""}-${props.initialTaskId ?? ""}`;

  return <FocusManualRecordModalContent key={formKey} {...props} />;
}

function FocusManualRecordModalContent({
  isOpen,
  onClose,
  activities,
  backpackItems,
  allInventoryItems = [],
  focusableTasks = [],
  records = [],
  editingRecord = null,
  initialActivityId,
  initialItemId,
  initialTaskId,
  onSuccess,
  onRecordUpdated,
}: FocusManualRecordModalProps) {
  const t = useTranslations("focus.manualRecord");
  const { isGamified } = useExperienceMode();

  const effectiveFocusableTasks: FocusableTaskItem[] =
    editingRecord?.taskId &&
    !focusableTasks.some((task) => task.id === editingRecord.taskId)
      ? [
          {
            id: editingRecord.taskId,
            title: editingRecord.taskNameSnapshot || t("taskTypeTodoLabel"),
            type: "todo" as const,
            completed: true,
          },
          ...focusableTasks,
        ]
      : focusableTasks;

  const form = useFocusManualRecordForm({
    isOpen,
    activities,
    backpackItems,
    allInventoryItems,
    focusableTasks: effectiveFocusableTasks,
    records,
    editingRecord,
    initialActivityId,
    initialItemId,
    initialTaskId,
    onSuccess,
    onRecordUpdated,
    onClose,
  });

  const isItemMode = form.targetType === "ITEM";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      preventClose={form.isSubmitting}
      headerIcon={
        form.isEditMode ? (
          <Pencil size={20} aria-hidden="true" />
        ) : (
          <History size={20} aria-hidden="true" />
        )
      }
      title={form.isEditMode ? t("editTitle") : t("title")}
      headerBadge={
        <span className="text-tiny uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-gold/15 dark:text-gold dark:border-gold/30">
          {form.isEditMode ? t("editBadge") : t("manualBadge")}
        </span>
      }
      description={form.isEditMode ? t("editDescription") : t("description")}
    >
      <form
        noValidate
        onSubmit={form.handleSubmit}
        className="flex flex-col gap-4 mt-1"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          <FocusManualTargetFields
            isGamified={isGamified}
            isEditMode={form.isEditMode}
            isPremium={form.isPremium}
            totalActivitiesCount={activities.length}
            targetType={form.targetType}
            onTargetTypeChange={form.handleTargetTypeChange}
            selectableActivities={form.selectableActivities}
            selectedActivityId={form.selectedActivityId}
            selectedActivity={form.selectedActivity}
            onSelectActivity={form.handleSelectActivity}
            effectiveFocusableTasks={effectiveFocusableTasks}
            selectedTaskId={form.selectedTaskId}
            onSelectTask={form.setSelectedTaskId}
            availableBackpackItems={form.availableBackpackItems}
            selectedItemId={form.selectedItemId}
            selectedItem={form.selectedItem}
            selectedItemMinutes={form.selectedItemMinutes}
            resolveItemEffectiveMinutes={form.resolveItemEffectiveMinutes}
            onSelectBackpackItem={form.handleSelectBackpackItem}
            recordType={form.recordType}
            onRecordTypeChange={form.setRecordType}
            notes={form.notes}
            onNotesChange={form.setNotes}
            targetError={form.fieldErrors.target}
          />

          <FocusManualScheduleFields
            isEditMode={form.isEditMode}
            isItemMode={isItemMode}
            recordType={form.recordType}
            selectedItemMinutes={form.selectedItemMinutes}
            durationMinutes={form.durationMinutes}
            durationInput={form.durationInput}
            onDurationInputChange={form.handleDurationInputChange}
            onDurationStep={form.handleDurationStep}
            onPresetSelect={form.handlePresetSelect}
            completedPomos={form.completedPomos}
            onCompletedPomosStep={form.handleCompletedPomosStep}
            sessionDate={form.sessionDate}
            maxDate={form.maxDate}
            onSessionDateChange={form.setSessionDate}
            startTimeStr={form.startTimeStr}
            endTimeStr={form.endTimeStr}
            crossesMidnight={form.crossesMidnight}
            onStartTimeChange={form.handleStartTimeChange}
            onEndTimeChange={form.handleEndTimeChange}
            fieldErrors={form.fieldErrors}
          />
        </div>

        <RewardPreview
          estimate={form.rewardEstimate}
          label={t("rewardEstimateLabel")}
        />

        <FocusModalFooter
          cancelLabel={t("cancelButton")}
          submitLabel={
            form.isEditMode ? t("updateSubmitButton") : t("submitButton")
          }
          submittingLabel={
            form.isEditMode ? t("updatingButton") : t("submittingButton")
          }
          isSubmitting={form.isSubmitting}
          onCancel={onClose}
        />
      </form>
    </BaseModal>
  );
}
