"use client";

import { Download, Mountain, Sparkles, Trophy, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  markAchievementsSeenAction,
  markArtifactsSeenAction,
} from "@/actions/showcaseActions";
import { ShowcaseCollectionSection } from "@/components/showcase/ShowcaseCollectionSection";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import type {
  PickerPendingItem,
  PickerTab,
} from "@/components/showcase/ShowcaseHighlightPickerModal";
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
import { useActiveAvatarFrame } from "@/store/avatarFrameStore";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
  TaskStreakHighlightDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type {
  FriendConnectionItem,
  FriendsOverviewData,
  UserRetrospectiveData,
} from "@/types/social";
import {
  resolveShowcaseCollectionTab,
  resolveShowcaseTab,
  type ShowcaseCollectionTabId,
  type ShowcaseTabId,
} from "@/utils";

const EMPTY_FRIENDS: FriendConnectionItem[] = [];
const EMPTY_ARTIFACTS: ArtifactItemResponseDTO[] = [];
const EMPTY_TASK_STREAKS: TaskStreakHighlightDTO[] = [];

const preloadProgressionPanel = () =>
  import("@/components/showcase/progression/ProgressionPyramidPanel").then(
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
  const urlCollectionParam = searchParams.get("collection");
  const tabsBaseId = useId();

  const [activeTab, setActiveTab] = useState<ShowcaseTabId>(initialTab);
  const [activeCollectionTab, setActiveCollectionTab] =
    useState<ShowcaseCollectionTabId>(() =>
      resolveShowcaseCollectionTab(urlCollectionParam, urlTabParam),
    );
  const [artifactsSeenDismissed, setArtifactsSeenDismissed] = useState(false);
  const [highlights, setHighlights] = useState<ProfileHighlightResponseDTO[]>(
    initialShowcase.highlights || [],
  );
  const [friendsOverview, setFriendsOverview] =
    useState<FriendsOverviewData | null>(initialFriendsOverview);

  useEffect(() => {
    setFriendsOverview(initialFriendsOverview);
  }, [initialFriendsOverview]);
  const [activeRetrospective, setActiveRetrospective] =
    useState<UserRetrospectiveData | null>(initialRetrospective);

  useEffect(() => {
    setActiveRetrospective(initialRetrospective);
  }, [initialRetrospective]);

  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    slotIndex: number;
    initialTab: PickerTab;
    pendingItem: PickerPendingItem | null;
  }>({
    isOpen: false,
    slotIndex: 0,
    initialTab: "achievements",
    pendingItem: null,
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

  useEffect(() => {
    setActiveTab(resolveShowcaseTab(urlTabParam));
    if (urlCollectionParam || urlTabParam === "artifacts") {
      setActiveCollectionTab(
        resolveShowcaseCollectionTab(urlCollectionParam, urlTabParam),
      );
    }
  }, [urlTabParam, urlCollectionParam]);

  useEffect(() => {
    setHighlights(initialShowcase.highlights || []);
  }, [initialShowcase.highlights]);

  useEffect(() => {
    setPreviewModalState((prev) => ({
      ...prev,
      retro: initialRetrospective,
    }));
  }, [initialRetrospective]);

  const markedAchievementsRef = useRef(false);
  const markedArtifactsRef = useRef(false);

  // Sincroniza achievementPoints no store global (apenas quando divergir) e marca conquistas/artefatos não vistos somente na aba de vitrine
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
  }, [initialShowcase.stats?.achievementPoints]);

  useEffect(() => {
    if (isVisitorMode || activeTab !== "overview") return;

    if (
      activeCollectionTab === "achievements" &&
      !markedAchievementsRef.current &&
      initialShowcase.achievements?.some((a) => a.unlocked && !a.seen)
    ) {
      markedAchievementsRef.current = true;
      void markAchievementsSeenAction();
    }

    if (
      activeCollectionTab === "artifacts" &&
      !markedArtifactsRef.current &&
      initialShowcase.artifacts?.some((a) => a.unlocked && !a.seen)
    ) {
      markedArtifactsRef.current = true;
      void markArtifactsSeenAction();
    }
  }, [
    isVisitorMode,
    activeTab,
    activeCollectionTab,
    initialShowcase.achievements,
    initialShowcase.artifacts,
  ]);

  const handleSelectTab = (tab: ShowcaseTabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
        params.delete("collection");
      }
      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  };

  const handleSelectCollectionTab = (tab: ShowcaseCollectionTabId) => {
    if (activeCollectionTab === "artifacts" && tab !== "artifacts") {
      setArtifactsSeenDismissed(true);
    }
    setActiveCollectionTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("tab");
      if (tab === "artifacts") {
        params.set("collection", "artifacts");
      } else {
        params.delete("collection");
      }
      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  };

  const handleOpenPicker = (slotIndex: number) => {
    setPickerState({
      isOpen: true,
      slotIndex,
      initialTab: "achievements",
      pendingItem: null,
    });
  };

  const resolveFirstAvailableSlot = (): number => {
    const usedSlots = new Set(highlights.map((h) => h.displayOrder));
    for (let i = 0; i < MAX_SHOWCASE_HIGHLIGHTS; i++) {
      if (!usedSlots.has(i)) {
        return i;
      }
    }
    return 0;
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
    setPickerState({
      isOpen: true,
      slotIndex: existingSlot
        ? existingSlot.displayOrder
        : resolveFirstAvailableSlot(),
      initialTab: "achievements",
      pendingItem: {
        highlightType: "ACHIEVEMENT",
        referenceId: achievement.id,
        highlightKey: achievement.code,
      },
    });
  };

  const handlePinArtifactFromGallery = (artifact: ArtifactItemResponseDTO) => {
    const existingSlot = highlights.find(
      (h) =>
        h.highlightType === "ARTIFACT" &&
        (h.referenceId === artifact.id || h.highlightKey === artifact.code),
    );
    setPickerState({
      isOpen: true,
      slotIndex: existingSlot
        ? existingSlot.displayOrder
        : resolveFirstAvailableSlot(),
      initialTab: "artifacts",
      pendingItem: {
        highlightType: "ARTIFACT",
        referenceId: artifact.id,
        highlightKey: artifact.code,
      },
    });
  };

  const storeUser = useUserStore((s) => s.user);
  const resolvedUser =
    storeUser && storeUser.id === initialShowcase.user.id
      ? storeUser
      : initialShowcase.user;
  const friendsCount = friendsOverview?.friendsCount ?? 0;
  const pendingRequestsCount = friendsOverview?.incomingRequests.length ?? 0;

  const showSeasonalRetroBanner = Boolean(
    activeRetrospective?.eligible && activeRetrospective.inSeasonalWindow,
  );

  const seasonalArchetypeTitle = activeRetrospective
    ? isGamified
      ? t(`retrospective.archetypes.${activeRetrospective.archetype}.title`)
      : t(
          `retrospective.archetypes.${activeRetrospective.archetype}.essentialTitle`,
        )
    : "";

  const tabs: ShowcaseTabItem<ShowcaseTabId>[] = [
    { id: "overview", label: t("tabs.overview"), icon: Trophy },
    {
      id: "progression",
      label: t("tabs.progression"),
      icon: Mountain,
      onPreload: preloadProgressionPanel,
    },
    {
      id: "friends",
      label: t("tabs.friends", { count: friendsCount }),
      icon: Users,
      badge:
        pendingRequestsCount > 0
          ? t("tabs.friendsPending", { count: pendingRequestsCount })
          : undefined,
      onPreload: preloadFriendsPanel,
    },
    {
      id: "retrospective",
      label: t("tabs.retrospective"),
      icon: Sparkles,
      onPreload: preloadRetrospectivePanel,
    },
  ];

  const overviewIds = getShowcaseTabIds(tabsBaseId, "overview");
  const progressionIds = getShowcaseTabIds(tabsBaseId, "progression");
  const friendsIds = getShowcaseTabIds(tabsBaseId, "friends");
  const retrospectiveIds = getShowcaseTabIds(tabsBaseId, "retrospective");

  const artifactsList = initialShowcase.artifacts ?? EMPTY_ARTIFACTS;
  const taskStreaksList = initialShowcase.taskStreaks ?? EMPTY_TASK_STREAKS;
  const unlockedArtifactsCount = useMemo(
    () => artifactsList.filter((a) => a.unlocked).length,
    [artifactsList],
  );

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

      {/* HERO HEADER: AVATAR + MOLDURA + TÍTULO + BIO + NÍVEL + BOTÃO CARD */}
      <ShowcaseHeroHeader
        user={resolvedUser}
        stats={initialShowcase.stats}
        achievements={initialShowcase.achievements}
        unlockedArtifactsCount={unlockedArtifactsCount}
        retrospective={activeRetrospective}
        isVisitorMode={isVisitorMode}
        onToggleVisitorMode={() => setIsVisitorMode((prev) => !prev)}
        onOpenProgression={() => handleSelectTab("progression")}
        onPreloadPreviewCard={preloadPreviewCardModal}
        onOpenPreviewCard={() =>
          setPreviewModalState({
            isOpen: true,
            mode: "profile",
            retro: activeRetrospective,
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
          {showSeasonalRetroBanner && activeRetrospective && (
            <section className="rounded-2xl border border-amber-500/45 dark:border-gold/45 bg-gradient-to-r from-amber-500/15 via-primary/15 to-surface/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-body-m font-extrabold text-neutral-50">
                    {t("header.retrospectiveBannerTitle", {
                      year: activeRetrospective.year,
                    })}
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {t("header.retrospectiveBannerDesc", {
                      days: activeRetrospective.activeDays,
                      tasks: activeRetrospective.tasksCompleted,
                      archetype: seasonalArchetypeTitle,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onMouseEnter={preloadPreviewCardModal}
                  onFocus={preloadPreviewCardModal}
                  onClick={() =>
                    setPreviewModalState({
                      isOpen: true,
                      mode: "retrospective",
                      retro: activeRetrospective,
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
            artifacts={artifactsList}
            taskStreaks={taskStreaksList}
            isVisitorMode={isVisitorMode}
            onOpenPicker={handleOpenPicker}
            onPreloadPicker={preloadHighlightPickerModal}
          />

          {/* INDICADORES VITALÍCIOS DE CONSISTÊNCIA & FEITOS (Server Component Slot) */}
          {statsSlot}

          {/* COLEÇÕES EM 2 SUB-ABAS: CONQUISTAS & ARTEFATOS */}
          <ShowcaseCollectionSection
            achievements={initialShowcase.achievements}
            artifacts={artifactsList}
            highlights={highlights}
            isVisitorMode={isVisitorMode}
            activeCollection={activeCollectionTab}
            onSelectCollection={handleSelectCollectionTab}
            onPinAchievement={handlePinAchievementFromGallery}
            onPinArtifact={handlePinArtifactFromGallery}
            totalAchievementsCount={
              initialShowcase.stats.totalAchievementsCount
            }
            totalArtifactsCount={initialShowcase.stats.totalArtifactsCount}
            artifactsSeenDismissed={artifactsSeenDismissed}
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
            friends={friendsOverview?.friends ?? EMPTY_FRIENDS}
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
          <FriendsNetworkPanel
            initialOverview={friendsOverview}
            onOverviewUpdated={setFriendsOverview}
          />
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
            initialRetrospective={activeRetrospective}
            isGamified={isGamified}
            isOwnProfile
            onRetrospectiveChange={setActiveRetrospective}
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
          key={`${pickerState.slotIndex}-${pickerState.initialTab}-${pickerState.pendingItem?.highlightType ?? ""}-${pickerState.pendingItem?.referenceId ?? pickerState.pendingItem?.highlightKey ?? ""}`}
          isOpen={pickerState.isOpen}
          initialSlotIndex={pickerState.slotIndex}
          initialTab={pickerState.initialTab}
          initialPendingItem={pickerState.pendingItem}
          user={resolvedUser}
          stats={initialShowcase.stats}
          highlights={highlights}
          achievements={initialShowcase.achievements}
          artifacts={artifactsList}
          taskStreaks={taskStreaksList}
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
          artifacts={artifactsList}
          taskStreaks={taskStreaksList}
          retrospective={previewModalState.retro ?? activeRetrospective}
        />
      )}
    </div>
  );
}
