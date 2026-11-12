"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { markAchievementsSeenAction } from "@/actions/showcaseActions";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { MAX_SHOWCASE_HIGHLIGHTS } from "@/constants/achievements";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";

const preloadHighlightPickerModal = () =>
  import("@/components/showcase/ShowcaseHighlightPickerModal").then(
    (mod) => mod.ShowcaseHighlightPickerModal,
  );

const ShowcaseHighlightPickerModal = dynamic(preloadHighlightPickerModal, {
  ssr: false,
});

interface ShowcaseContainerProps {
  initialShowcase: UserShowcaseResponseDTO;
}

export function ShowcaseContainer({ initialShowcase }: ShowcaseContainerProps) {
  const [highlights, setHighlights] = useState<ProfileHighlightResponseDTO[]>(
    initialShowcase.highlights || [],
  );
  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    slotIndex: number;
  }>({
    isOpen: false,
    slotIndex: 0,
  });

  useIdlePreload(preloadHighlightPickerModal);

  useEffect(() => {
    setHighlights(initialShowcase.highlights || []);
  }, [initialShowcase.highlights]);

  // Sincroniza achievementPoints no store global (apenas quando divergir) e marca conquistas não vistas como vistas ao abrir a vitrine
  useEffect(() => {
    const nextPoints = initialShowcase.stats?.achievementPoints;
    if (nextPoints !== undefined) {
      const currentUser = useUserStore.getState().user;
      if (currentUser && currentUser.achievementPoints !== nextPoints) {
        useUserStore.getState().updateUserPartial({
          achievementPoints: nextPoints,
        });
      }
    }

    const hasUnseen = initialShowcase.achievements?.some(
      (a) => a.unlocked && !a.seen,
    );
    if (hasUnseen) {
      void markAchievementsSeenAction();
    }
  }, [initialShowcase.stats?.achievementPoints, initialShowcase.achievements]);

  const handleOpenPicker = (slotIndex: number) => {
    setPickerState({ isOpen: true, slotIndex });
  };

  const handlePinAchievementFromGallery = (
    achievement: AchievementItemResponseDTO,
  ) => {
    const existingSlot = highlights.find(
      (h) =>
        h.highlightType === "ACHIEVEMENT" &&
        (h.referenceId === achievement.id ||
          h.highlightKey === achievement.code),
    );
    if (existingSlot) {
      setPickerState({
        isOpen: true,
        slotIndex: existingSlot.displayOrder,
      });
      return;
    }

    const usedSlots = new Set(highlights.map((h) => h.displayOrder));
    let targetSlot = 0;
    for (let i = 0; i < MAX_SHOWCASE_HIGHLIGHTS; i++) {
      if (!usedSlots.has(i)) {
        targetSlot = i;
        break;
      }
    }

    setPickerState({ isOpen: true, slotIndex: targetSlot });
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 gap-7">
      {/* HERO HEADER: AVATAR + MOLDURA + BIO + NÍVEL + PONTOS DE CONQUISTA */}
      <ShowcaseHeroHeader
        user={initialShowcase.user}
        stats={initialShowcase.stats}
        isVisitorMode={isVisitorMode}
        onToggleVisitorMode={() => setIsVisitorMode((prev) => !prev)}
      />

      {/* VITRINE DE DESTAQUES (4 SLOTS PERSONALIZÁVEIS) */}
      <ShowcaseHighlightsSection
        user={initialShowcase.user}
        stats={initialShowcase.stats}
        highlights={highlights}
        achievements={initialShowcase.achievements}
        isVisitorMode={isVisitorMode}
        onOpenPicker={handleOpenPicker}
      />

      {/* INDICADORES VITALÍCIOS DE CONSISTÊNCIA & FEITOS */}
      <ShowcaseStatsGrid stats={initialShowcase.stats} />

      {/* GALERIA DE 59 CONQUISTAS & MEDALHAS */}
      <AchievementsGallery
        achievements={initialShowcase.achievements}
        highlights={highlights}
        isVisitorMode={isVisitorMode}
        onPinAchievement={handlePinAchievementFromGallery}
      />

      {/* MODAL DE SELEÇÃO DOS 4 SLOTS */}
      {pickerState.isOpen && (
        <ShowcaseHighlightPickerModal
          key={pickerState.slotIndex}
          isOpen={pickerState.isOpen}
          initialSlotIndex={pickerState.slotIndex}
          user={initialShowcase.user}
          stats={initialShowcase.stats}
          highlights={highlights}
          achievements={initialShowcase.achievements}
          onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
          onSaved={(updated) => setHighlights(updated)}
        />
      )}
    </div>
  );
}
