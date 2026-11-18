"use client";

import { Download, Mountain, Sparkles, Trophy, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useState } from "react";
import { markAchievementsSeenAction } from "@/actions/showcaseActions";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
import {
  getShowcaseTabIds,
  type ShowcaseTabItem,
  ShowcaseTabPanelFallback,
  ShowcaseTabs,
} from "@/components/showcase/ShowcaseTabs";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { MAX_SHOWCASE_HIGHLIGHTS } from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import { useActiveAvatarFrame } from "@/store/avatarFrameStore";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type {
  FriendConnectionItem,
  FriendsOverviewData,
  UserRetrospectiveData,
} from "@/types/social";
import { resolveShowcaseTab, type ShowcaseTabId } from "@/utils";

const EMPTY_FRIENDS: FriendConnectionItem[] = [];

const preloadProgressionPanel = () =>
  import("@/components/showcase/ProgressionPyramidPanel").then(
    (mod) => mod.ProgressionPyramidPanel,
  );

const ProgressionPyramidPanel = dynamic(preloadProgressionPanel, {
  loading: ShowcaseTabPanelFallback,
});

const preloadFriendsPanel = () =>
  import("@/components/showcase/FriendsNetworkPanel").then(
    (mod) => mod.FriendsNetworkPanel,
  );

const FriendsNetworkPanel = dynamic(preloadFriendsPanel, {
  loading: ShowcaseTabPanelFallback,
});

const preloadRetrospectivePanel = () =>
  import("@/components/showcase/RetrospectivePanel").then(
    (mod) => mod.RetrospectivePanel,
  );

const RetrospectivePanel = dynamic(preloadRetrospectivePanel, {
  loading: ShowcaseTabPanelFallback,
});

const preloadHighlightPickerModal = () =>
  import("@/components/showcase/ShowcaseHighlightPickerModal").then(
    (mod) => mod.ShowcaseHighlightPickerModal,
  );

const ShowcaseHighlightPickerModal = dynamic(preloadHighlightPickerModal, {
  ssr: false,
});

const preloadPreviewCardModal = () =>
  import("@/components/showcase/ProfilePreviewCardModal").then(
    (mod) => mod.ProfilePreviewCardModal,
  );

const ProfilePreviewCardModal = dynamic(preloadPreviewCardModal, {
  ssr: false,
});

interface ShowcaseContainerProps {
  initialShowcase: UserShowcaseResponseDTO;
  initialFriendsOverview?: FriendsOverviewData | null;
  initialRetrospective?: UserRetrospectiveData | null;
  initialTab?: ShowcaseTabId;
  statsSlot?: ReactNode;
}

export function ShowcaseContainer({
  initialShowcase,
  initialFriendsOverview = null,
  initialRetrospective = null,
  initialTab = "overview",
  statsSlot,
}: ShowcaseContainerProps) {
  const t = useTranslations("showcase");
  const { isGamified } = useExperienceMode();
  const activeFrameId = useActiveAvatarFrame();
  const searchParams = useSearchParams();
  const urlTabParam = searchParams.get("tab");
  const tabsBaseId = useId();

  const [activeTab, setActiveTab] = useState<ShowcaseTabId>(initialTab);
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
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    mode: "profile" | "retrospective";
    retro: UserRetrospectiveData | null;
  }>({
    isOpen: false,
    mode: "profile",
    retro: initialRetrospective,
  });

  useIdlePreload(preloadHighlightPickerModal);
  useIdlePreload(preloadPreviewCardModal);
  useIdlePreload(preloadProgressionPanel);
  useIdlePreload(preloadFriendsPanel);
  useIdlePreload(preloadRetrospectivePanel);

  useEffect(() => {
    setActiveTab(resolveShowcaseTab(urlTabParam));
  }, [urlTabParam]);

  useEffect(() => {
    setHighlights(initialShowcase.highlights || []);
  }, [initialShowcase.highlights]);

  useEffect(() => {
    setPreviewModalState((prev) => ({
      ...prev,
      retro: initialRetrospective,
    }));
  }, [initialRetrospective]);

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

  const handleSelectTab = (tab: ShowcaseTabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  };

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

  const storeUser = useUserStore((s) => s.user);
  const resolvedUser =
    storeUser && storeUser.id === initialShowcase.user.id
      ? storeUser
      : initialShowcase.user;
  const friendsCount = initialFriendsOverview?.friendsCount ?? 0;
  const pendingRequestsCount =
    initialFriendsOverview?.incomingRequests.length ?? 0;

  const showSeasonalRetroBanner = Boolean(
    initialRetrospective?.eligible && initialRetrospective.inSeasonalWindow,
  );

  const seasonalArchetypeTitle = initialRetrospective
    ? isGamified
      ? t(`retrospective.archetypes.${initialRetrospective.archetype}.title`)
      : t(
          `retrospective.archetypes.${initialRetrospective.archetype}.essentialTitle`,
        )
    : "";

  const tabs: ShowcaseTabItem<ShowcaseTabId>[] = [
    { id: "overview", label: t("tabs.overview"), icon: Trophy },
    { id: "progression", label: t("tabs.progression"), icon: Mountain },
    {
      id: "friends",
      label: t("tabs.friends", { count: friendsCount }),
      icon: Users,
      badge:
        pendingRequestsCount > 0
          ? t("tabs.friendsPending", { count: pendingRequestsCount })
          : undefined,
    },
    { id: "retrospective", label: t("tabs.retrospective"), icon: Sparkles },
  ];

  const overviewIds = getShowcaseTabIds(tabsBaseId, "overview");
  const progressionIds = getShowcaseTabIds(tabsBaseId, "progression");
  const friendsIds = getShowcaseTabIds(tabsBaseId, "friends");
  const retrospectiveIds = getShowcaseTabIds(tabsBaseId, "retrospective");

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 gap-6">
      {searchParams.get("from") === "settings" && (
        <div className="flex items-center">
          <ContextualBackButton
            fallbackHref="/settings"
            label={t("backToSettings")}
          />
        </div>
      )}

      {/* HERO HEADER: AVATAR + MOLDURA + BIO + NÍVEL + BOTÃO CARD */}
      <ShowcaseHeroHeader
        user={resolvedUser}
        stats={initialShowcase.stats}
        isVisitorMode={isVisitorMode}
        onToggleVisitorMode={() => setIsVisitorMode((prev) => !prev)}
        onOpenProgression={() => handleSelectTab("progression")}
        onOpenPreviewCard={() =>
          setPreviewModalState({
            isOpen: true,
            mode: "profile",
            retro: initialRetrospective,
          })
        }
      />

      {/* NAVEGAÇÃO DE ABAS DO PERFIL: VITRINE | PROGRESSÃO | AMIGOS | RETROSPECTIVA */}
      <ShowcaseTabs
        baseId={tabsBaseId}
        ariaLabel={t("tabs.navAria")}
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* ABA 1: VITRINE & CONQUISTAS */}
      {activeTab === "overview" && (
        <div
          id={overviewIds.panelId}
          role="tabpanel"
          aria-labelledby={overviewIds.tabId}
          className="flex flex-col gap-7"
        >
          {showSeasonalRetroBanner && initialRetrospective && (
            <section className="rounded-2xl border border-amber-500/45 dark:border-gold/45 bg-gradient-to-r from-amber-500/15 via-primary/15 to-surface/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-body-m font-extrabold text-neutral-50">
                    {t("header.retrospectiveBannerTitle", {
                      year: initialRetrospective.year,
                    })}
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {t("header.retrospectiveBannerDesc", {
                      days: initialRetrospective.activeDays,
                      tasks: initialRetrospective.tasksCompleted,
                      archetype: seasonalArchetypeTitle,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModalState({
                      isOpen: true,
                      mode: "retrospective",
                      retro: initialRetrospective,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer"
                >
                  <Download size={14} aria-hidden="true" />
                  <span>{t("header.retrospectiveBannerBtn")}</span>
                </button>
              </div>
            </section>
          )}

          {/* VITRINE DE DESTAQUES (4 SLOTS PERSONALIZÁVEIS) */}
          <ShowcaseHighlightsSection
            user={resolvedUser}
            stats={initialShowcase.stats}
            highlights={highlights}
            achievements={initialShowcase.achievements}
            isVisitorMode={isVisitorMode}
            onOpenPicker={handleOpenPicker}
          />

          {/* INDICADORES VITALÍCIOS DE CONSISTÊNCIA & FEITOS (Server Component Slot) */}
          {statsSlot}

          {/* GALERIA DE CONQUISTAS & MEDALHAS */}
          <AchievementsGallery
            achievements={initialShowcase.achievements}
            highlights={highlights}
            isVisitorMode={isVisitorMode}
            onPinAchievement={handlePinAchievementFromGallery}
          />
        </div>
      )}

      {/* ABA 2: PIRÂMIDE DE PROGRESSÃO & PATENTES */}
      {activeTab === "progression" && (
        <div
          id={progressionIds.panelId}
          role="tabpanel"
          aria-labelledby={progressionIds.tabId}
        >
          <ProgressionPyramidPanel
            user={resolvedUser}
            stats={initialShowcase.stats}
            achievements={initialShowcase.achievements}
            friends={initialFriendsOverview?.friends ?? EMPTY_FRIENDS}
            activeFrameId={activeFrameId}
            isVisitorMode={isVisitorMode}
          />
        </div>
      )}

      {/* ABA 3: REDE SOCIAL & AMIGOS */}
      {activeTab === "friends" && (
        <div
          id={friendsIds.panelId}
          role="tabpanel"
          aria-labelledby={friendsIds.tabId}
        >
          <FriendsNetworkPanel initialOverview={initialFriendsOverview} />
        </div>
      )}

      {/* ABA 4: RETROSPECTIVA ANUAL */}
      {activeTab === "retrospective" && (
        <div
          id={retrospectiveIds.panelId}
          role="tabpanel"
          aria-labelledby={retrospectiveIds.tabId}
        >
          <RetrospectivePanel
            initialRetrospective={initialRetrospective}
            isGamified={isGamified}
            isOwnProfile
            onOpenExportModal={(retroData) =>
              setPreviewModalState({
                isOpen: true,
                mode: "retrospective",
                retro: retroData,
              })
            }
          />
        </div>
      )}

      {/* MODAL DE SELEÇÃO DOS 4 SLOTS */}
      {pickerState.isOpen && (
        <ShowcaseHighlightPickerModal
          key={pickerState.slotIndex}
          isOpen={pickerState.isOpen}
          initialSlotIndex={pickerState.slotIndex}
          user={resolvedUser}
          stats={initialShowcase.stats}
          highlights={highlights}
          achievements={initialShowcase.achievements}
          onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
          onSaved={(updated) => setHighlights(updated)}
        />
      )}

      {/* MODAL GERADOR DE CARD / BANNER PNG */}
      {previewModalState.isOpen && (
        <ProfilePreviewCardModal
          isOpen={previewModalState.isOpen}
          onClose={() =>
            setPreviewModalState((prev) => ({ ...prev, isOpen: false }))
          }
          initialMode={previewModalState.mode}
          isGamified={isGamified}
          user={resolvedUser}
          activeFrameId={activeFrameId}
          stats={initialShowcase.stats}
          highlights={highlights}
          achievements={initialShowcase.achievements}
          retrospective={previewModalState.retro ?? initialRetrospective}
        />
      )}
    </div>
  );
}
