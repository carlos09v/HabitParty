"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Backpack,
  Flame,
  Package,
  PackageOpen,
  SearchX,
  Store,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  consumeInventoryItem,
  discardInventoryItem,
  reorderInventory,
  returnItemToBackpack,
  sendItemToFocus,
} from "@/actions/inventoryActions";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { ItemRow, ItemRowHeader } from "@/components/ui/ItemRow";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { AppLocale } from "@/i18n/config";
import type { InventoryItem } from "@/types/inventory";
import type { SelectOption } from "@/types/ui";
import { cn } from "@/utils";
import { calculateInventoryWelcomeStats } from "@/utils/catalogMetrics";
import {
  executeInventoryItemAction,
  getInventoryItemActionMeta,
} from "@/utils/inventoryHelpers";
import { soundEffects } from "@/utils/soundEffects";

const MysteryBoxRouletteModal = dynamic(
  () =>
    import("@/components/inventory/MysteryBoxRouletteModal").then((mod) => ({
      default: mod.MysteryBoxRouletteModal,
    })),
  { ssr: false },
);

export function InventoryContainer({
  initialItems,
  isCompact = false,
}: {
  initialItems: InventoryItem[];
  isCompact?: boolean;
}) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("inventory.container");
  const tHelpers = useTranslations("inventory.helpers");
  const { isGamified } = useExperienceMode();

  const actionLabels = useMemo(
    () => ({
      openInFocus: tHelpers("openInFocus"),
      openBox: tHelpers("openBox"),
      sendToFocus: tHelpers("sendToFocus"),
      use: tHelpers("use"),
    }),
    [tHelpers],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { label: t("filters.statusAll"), value: "" },
      { label: t("filters.statusAvailable"), value: "AVAILABLE" },
      { label: t("filters.statusInFocus"), value: "IN_FOCUS" },
    ],
    [t],
  );

  const typeOptions = useMemo<SelectOption[]>(
    () => [
      { label: t("filters.typeAll"), value: "" },
      { label: t("filters.typeSingleUse"), value: "SingleUse" },
      { label: t("filters.typeTimeBased"), value: "TimeBased" },
      { label: t("filters.typeMysteryBox"), value: "MysteryBox" },
    ],
    [t],
  );

  const sortOptions = useMemo<SelectOption[]>(
    () => [
      { label: t("filters.sortDefault"), value: "" },
      { label: t("filters.sortQuantityDesc"), value: "quantity-desc" },
      { label: t("filters.sortName"), value: "name" },
    ],
    [t],
  );

  const {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  } = useItemCatalogFilters("inventory");

  const { items, setItems, sensors, handleDragEnd } =
    useReorderableList<InventoryItem>({
      initialItems,
      onReorderServerAction: async (updates) => {
        return reorderInventory(
          updates.map((u) => ({ itemId: u.id, newIndex: u.newIndex })),
        );
      },
      isFiltering,
    });

  const [isUsing, setIsUsing] = useState(false);
  const [isSendingToFocus, setIsSendingToFocus] = useState(false);
  const [openingBoxItem, setOpeningBoxItem] = useState<InventoryItem | null>(
    null,
  );
  const [itemToDiscard, setItemToDiscard] = useState<InventoryItem | null>(
    null,
  );
  const [isDiscarding, startDiscardTransition] = useTransition();

  const handleOpenMysteryBox = useCallback((item: InventoryItem) => {
    setOpeningBoxItem(item);
  }, []);

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchSearch =
        !filters.search ||
        item.reward.title
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.reward.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchType = !filters.type || item.reward.type === filters.type;
      const matchCat =
        !filters.category || item.reward.category === filters.category;

      const matchStatus =
        !filters.status ||
        (filters.status === "IN_FOCUS"
          ? item.status === "IN_FOCUS"
          : item.status !== "IN_FOCUS");

      return matchSearch && matchType && matchCat && matchStatus;
    });

    if (filters.sortBy === "quantity-desc") {
      result = [...result].sort((a, b) => b.quantity - a.quantity);
    } else if (filters.sortBy === "name") {
      result = [...result].sort((a, b) =>
        a.reward.title.localeCompare(b.reward.title),
      );
    }

    return result;
  }, [items, filters]);

  const handleUseItem = useCallback(
    async (item: InventoryItem) => {
      if (isUsing) return;
      setIsUsing(true);
      try {
        const res = await consumeInventoryItem(item.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.useError"));
          return;
        }
        setItems((prev) =>
          prev
            .map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
            )
            .filter((i) => i.quantity > 0),
        );
        soundEffects.playTaskCompleteSound();
        toast.success(t("toasts.useSuccess", { title: item.reward.title }));
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setIsUsing(false);
      }
    },
    [isUsing, setItems, t],
  );

  const handleSendToFocus = useCallback(
    async (item: InventoryItem) => {
      if (isSendingToFocus) return;
      setIsSendingToFocus(true);
      try {
        const res = await sendItemToFocus(item.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.sendToFocusError"));
          return;
        }
        setItems((prev) => {
          if (item.quantity <= 1) {
            return prev.map((i) =>
              i.id === item.id ? { ...i, status: "IN_FOCUS" } : i,
            );
          }
          // Se havia mais de 1 unidade agrupada, reduz 1 da disponível e sincroniza com o servidor
          return prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
          );
        });
        soundEffects.playTaskCompleteSound();
        toast.success(
          t("toasts.sendToFocusSuccess", { title: item.reward.title }),
        );
        router.refresh();
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setIsSendingToFocus(false);
      }
    },
    [isSendingToFocus, setItems, router, t],
  );

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: InventoryItem | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const handleItemContextMenu = useCallback(
    (e: React.MouseEvent, item: InventoryItem) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        item,
      });
    },
    [],
  );

  const handleReturnToBackpack = useCallback(
    async (item: InventoryItem) => {
      try {
        const res = await returnItemToBackpack(item.id);
        if (!res.success) {
          toast.error(
            res.error ||
              (isGamified
                ? t("toasts.returnToBackpackErrorGamified")
                : t("toasts.returnToBackpackErrorProductivity")),
          );
          return;
        }

        soundEffects.playTaskCompleteSound();
        toast.success(
          isGamified
            ? t("toasts.returnToBackpackSuccessGamified", {
                title: item.reward.title,
              })
            : t("toasts.returnToBackpackSuccessProductivity", {
                title: item.reward.title,
              }),
        );
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "AVAILABLE" } : i,
          ),
        );
        router.refresh();
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      }
    },
    [isGamified, setItems, router, t],
  );

  const handleConfirmDiscard = () => {
    if (!itemToDiscard) return;
    const target = itemToDiscard;
    const previousItems = [...items];

    setItems((prev) =>
      prev
        .map((i) =>
          i.id === target.id ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
    setItemToDiscard(null);

    startDiscardTransition(async () => {
      const res = await discardInventoryItem(target.id);
      if (res.success) {
        toast.success(
          t("toasts.discardSuccess", { title: target.reward.title }),
        );
      } else {
        setItems(previousItems);
        toast.error(res.error || t("toasts.discardError"));
      }
    });
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const target = contextMenu.item;
    if (!target) return [];

    const { isInFocus, isMystery, isCoupon } = getInventoryItemActionMeta(
      target,
      actionLabels,
    );

    if (isInFocus) {
      return [
        {
          label: t("contextMenu.openInFocus"),
          icon: <Flame size={15} />,
          onClick: () => router.push("/focus"),
        },
        {
          label: isGamified
            ? t("contextMenu.returnToBackpackGamified")
            : t("contextMenu.returnToBackpackProductivity"),
          icon: <Undo2 size={15} />,
          onClick: () => handleReturnToBackpack(target),
        },
      ];
    }

    const actions: ContextMenuItem[] = [];

    if (isMystery) {
      actions.push({
        label: t("contextMenu.openMysteryBox"),
        icon: <PackageOpen size={15} />,
        onClick: () => handleOpenMysteryBox(target),
      });
    } else if (isCoupon) {
      actions.push(
        {
          label: t("contextMenu.sendToFocus"),
          icon: <Flame size={15} />,
          onClick: () => handleSendToFocus(target),
        },
        {
          label: t("contextMenu.useImmediately"),
          icon: <Zap size={15} />,
          onClick: () => handleUseItem(target),
        },
      );
    } else {
      actions.push({
        label: t("contextMenu.useItem"),
        icon: <Zap size={15} />,
        onClick: () => handleUseItem(target),
      });
    }

    actions.push({
      label: t("contextMenu.discardItem"),
      icon: <Trash2 size={15} />,
      variant: "destructive",
      onClick: () => setItemToDiscard(target),
    });

    return actions;
  }, [
    contextMenu.item,
    actionLabels,
    isGamified,
    t,
    router,
    handleReturnToBackpack,
    handleOpenMysteryBox,
    handleSendToFocus,
    handleUseItem,
  ]);

  const { stats: welcomeStats } = useMemo(() => {
    return calculateInventoryWelcomeStats(items, locale);
  }, [items, locale]);

  return (
    <>
      <WelcomeCard
        compact={isCompact}
        title={WELCOME_CARD_DETAILS.inventory.title}
        subtitle={WELCOME_CARD_DETAILS.inventory.subtitle}
        bullets={WELCOME_CARD_DETAILS.inventory.bullets}
        imageSrc={WELCOME_CARD_DETAILS.inventory.imageSrc}
        stats={welcomeStats}
        imageWidth={
          isCompact
            ? WELCOME_CARD_DETAILS.inventory.compactWidth
            : WELCOME_CARD_DETAILS.inventory.normalWidth
        }
        imageHeight={
          isCompact
            ? WELCOME_CARD_DETAILS.inventory.compactHeight
            : WELCOME_CARD_DETAILS.inventory.normalHeight
        }
        storageKey="inventory"
      />

      <section className="flex-1 min-h-0 flex flex-col gap-4 sm:gap-6 w-full pb-10">
        <FilterBar
          search={{
            value: filters.search,
            onChange: (v) => handleFilterChange({ search: v }),
          }}
          viewMode={{
            value: viewMode,
            onChange: setViewMode,
          }}
          dropdownFilters={[
            {
              id: "status",
              label: t("filters.statusLabel"),
              options: statusOptions,
              value: filters.status || "",
            },
            {
              id: "type",
              label: t("filters.typeLabel"),
              options: typeOptions,
              value: filters.type,
            },
            {
              id: "sortBy",
              label: t("filters.sortLabel"),
              options: sortOptions,
              value: filters.sortBy || "",
            },
          ]}
          onDropdownChange={(id, value) => handleFilterChange({ [id]: value })}
          onClearDropdowns={handleClearFilters}
        />

        {filteredItems.length === 0 ? (
          <div className="flex flex-col gap-2.5 w-full pb-8">
            {viewMode === "list" && (
              <ItemRowHeader isCompact={isCompact} mode="inventory" />
            )}
            <CatalogEmptyState
              isCompact={isCompact}
              icon={
                items.length === 0 ? (isGamified ? Backpack : Package) : SearchX
              }
              title={
                items.length === 0
                  ? isGamified
                    ? t("emptyState.emptyTitleGamified")
                    : t("emptyState.emptyTitleProductivity")
                  : t("emptyState.noResultsTitle")
              }
              description={
                items.length === 0
                  ? isGamified
                    ? t("emptyState.emptyDescriptionGamified")
                    : t("emptyState.emptyDescriptionProductivity")
                  : t("emptyState.noResultsDescription")
              }
              action={
                items.length === 0 ? (
                  <Link
                    href="/rewards"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer"
                  >
                    <Store size={15} />
                    <span>{t("emptyState.exploreStore")}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-surface/80 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/10 transition-all cursor-pointer"
                  >
                    <span>{t("emptyState.clearFilters")}</span>
                  </button>
                )
              }
            />
          </div>
        ) : (
          <DndContext
            id="inventory-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement, restrictToWindowEdges]}
          >
            <SortableContext
              items={filteredItems.map((i) => i.id)}
              strategy={
                viewMode === "card"
                  ? rectSortingStrategy
                  : verticalListSortingStrategy
              }
            >
              {viewMode === "card" ? (
                <div
                  className={cn(
                    "w-full transition-all duration-200 pb-8",
                    isCompact
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
                  )}
                >
                  {filteredItems.map((item) => (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      onUse={handleUseItem}
                      onSendToFocus={handleSendToFocus}
                      onOpenMysteryBox={handleOpenMysteryBox}
                      onContextMenu={handleItemContextMenu}
                      isCompact={isCompact}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 w-full pb-8">
                  <ItemRowHeader isCompact={isCompact} mode="inventory" />
                  <ul
                    className="flex flex-col gap-2 w-full"
                    aria-label={t("listAriaLabel")}
                  >
                    {filteredItems.map((item) => {
                      const { isInFocus, actionLabel, secondaryActionLabel } =
                        getInventoryItemActionMeta(item, actionLabels);

                      const handleAction = () => {
                        executeInventoryItemAction(item, {
                          onOpenFocus: () => router.push("/focus"),
                          onOpenMysteryBox: handleOpenMysteryBox,
                          onSendToFocus: handleSendToFocus,
                          onUse: handleUseItem,
                        });
                      };

                      const handleSecondaryAction = secondaryActionLabel
                        ? () => handleUseItem(item)
                        : undefined;

                      return (
                        <ItemRow
                          key={item.id}
                          id={item.id}
                          title={item.reward?.title || item.name}
                          description={
                            item.reward?.description || item.description
                          }
                          type={item.reward?.type || item.itemType}
                          packageLevel={item.reward?.packageLevel}
                          category={item.reward?.category}
                          iconName={item.reward?.iconName || item.iconName}
                          baseDurationMinutes={item.reward?.baseDurationMinutes}
                          remainingSeconds={item.remainingSeconds}
                          quantity={item.quantity}
                          inUse={isInFocus}
                          isActiveFocusSession={isInFocus}
                          actionLabel={actionLabel}
                          onAction={handleAction}
                          secondaryActionLabel={secondaryActionLabel}
                          onSecondaryAction={handleSecondaryAction}
                          onContextMenu={(e) => handleItemContextMenu(e, item)}
                          isCompact={isCompact}
                          dragData={{ type: "InventoryItem", item }}
                        />
                      );
                    })}
                  </ul>
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </section>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={contextMenuItems}
      />

      <ConfirmationModal
        isOpen={Boolean(itemToDiscard)}
        onClose={() => !isDiscarding && setItemToDiscard(null)}
        onConfirm={handleConfirmDiscard}
        title={
          isGamified
            ? t("discardModal.titleGamified")
            : t("discardModal.titleProductivity")
        }
        description={
          itemToDiscard ? (
            <span>
              {t.rich("discardModal.description", {
                title: itemToDiscard.reward.title,
                strong: (chunks) => (
                  <strong className="text-neutral-100">{chunks}</strong>
                ),
              })}
            </span>
          ) : null
        }
        confirmText={t("discardModal.confirmText")}
        cancelText={t("discardModal.cancelText")}
        variant="danger"
        isLoading={isDiscarding}
      />

      {openingBoxItem && (
        <MysteryBoxRouletteModal
          isOpen={Boolean(openingBoxItem)}
          onClose={() => {
            setOpeningBoxItem(null);
            router.refresh();
          }}
          item={openingBoxItem}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
