import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type CSSProperties, memo, useMemo } from "react";
import { type FocusActivityCardVariantProps, FocusCard } from "./FocusCard";

/**
 * Wrapper Sortable isolado para atividades destravadas.
 * Mantido em módulo próprio para que `FocusBackpackSection` (que importa apenas `FocusCard`)
 * não carregue `@dnd-kit/sortable` nem `@dnd-kit/utilities`.
 */
export const SortableFocusActivityCard = memo(
  function SortableFocusActivityCard(
    props: Omit<
      FocusActivityCardVariantProps,
      | "sortableRef"
      | "sortableActivatorRef"
      | "sortableStyle"
      | "sortableAttributes"
      | "sortableListeners"
      | "isDragging"
    >,
  ) {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: props.activity.id,
      disabled: Boolean(props.isLocked),
    });

    const transformStr = CSS.Translate.toString(transform);
    const effectiveTransition = isDragging ? undefined : transition;
    const style = useMemo<CSSProperties>(
      () => ({
        transform: transformStr,
        transition: effectiveTransition,
      }),
      [transformStr, effectiveTransition],
    );

    return (
      <FocusCard
        {...props}
        isDragging={isDragging}
        sortableRef={setNodeRef}
        sortableActivatorRef={setActivatorNodeRef}
        sortableStyle={style}
        sortableAttributes={attributes}
        sortableListeners={listeners}
      />
    );
  },
);
