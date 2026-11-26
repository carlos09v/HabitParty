"use client";

import { Download, Mountain, Sparkles, Trophy, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  markAchievementsSeenAction,
  markArtifactsSeenAction,
  updateMyHighlightsAction,
} from "@/actions/showcaseActions";
import {
  getFriendsOverviewAction,
  getMyRetrospectiveAction,
} from "@/actions/socialActions";
import { PrivateProfileNotice } from "@/components/showcase/PrivateProfileNotice";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import type {
  PickerPendingItem,
  PickerTab,
} from "@/components/showcase/ShowcaseHighlightPickerModal";
import { ShowcaseOverviewLayout } from "@/components/showcase/ShowcaseOverviewLayout";
import { ShowcaseStatsVisibilityProvider } from "@/components/showcase/ShowcaseStatsGridView";
import {
  getShowcaseTabIds,
  type ShowcaseTabItem,
  ShowcaseTabPanelFallback,
  ShowcaseTabs,
} from "@/components/showcase/ShowcaseTabs";
import {
  EMPTY_ARTIFACTS,
  EMPTY_FRIENDS,
  EMPTY_TASK_STREAKS,
  FriendsNetworkPanel,
  ProfilePreviewCardModal,
  ProgressionPyramidPanel,
  preloadFriendsPanel,
  preloadHighlightPickerModal,
  preloadPreviewCardModal,
  preloadProgressionPanel,
  preloadRetrospectivePanel,
  RetrospectivePanel,
  ShowcaseHighlightPickerModal,
} from "@/components/showcase/showcaseDynamicPanels";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { MAX_SHOWCASE_HIGHLIGHTS } from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import {
  type LazyLoadStatus,
  useLazyRetrospective,
} from "@/hooks/useLazyRetrospective";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import {
  resolveUserAvatarFrame,
  useActiveAvatarFrame,
  useUserStore,
} from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  HighlightSlotInputDTO,
  ProfileHighlightResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type {
  FriendsOverviewData,
  UserRetrospectiveData,
} from "@/types/social";
import {
  canAudienceViewVisibility,
  createEmptyShowcaseData,
  resolveShowcaseCollectionTab,
  resolveShowcaseTab,
  type ShowcaseCollectionTabId,
  type ShowcaseTabId,
  type VisitorAudience,
} from "@/utils/showcaseUtils";

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
  const tPublic = useTranslations("showcase.publicProfile");
  const { isGamified } = useExperienceMode();
  const searchParams = useSearchParams();
  const urlTabParam = searchParams.get("tab");
  const urlCollectionParam = searchParams.get("collection");
  const tabsBaseId = useId();

  const [activeTab, setActiveTab] = useState<ShowcaseTabId>(initialTab);
  const [activeCollectionTab, setActiveCollectionTab] =
    useState<ShowcaseCollectionTabId>(() =>
      resolveShowcaseCollectionTab(urlCollectionParam, urlTabParam),
    );
  const [achievementsSeenDismissed, setAchievementsSeenDismissed] =
    useState(false);
  const [artifactsSeenDismissed, setArtifactsSeenDismissed] = useState(false);
  const [highlights, setHighlights] = useState<ProfileHighlightResponseDTO[]>(
    initialShowcase.highlights || [],
  );

  // Lazy-loaded tabs state (Friends & Retrospective)
  const [friendsOverview, setFriendsOverview] =
    useState<FriendsOverviewData | null>(initialFriendsOverview);
  const [friendsStatus, setFriendsStatus] = useState<LazyLoadStatus>(
    initialFriendsOverview ? "ready" : "idle",
  );
  const friendsLoadedRef = useRef(Boolean(initialFriendsOverview));

  const {
    retrospective: activeRetrospective,
    status: retroStatus,
    isLoading: isRetroLoading,
    loadError: isRetroLoadError,
    ensureLoaded: ensureRetrospectiveLoaded,
    setRetrospectiveData: setActiveRetrospectiveData,
  } = useLazyRetrospective({
    initialRetrospective,
    fetcher: (year) => getMyRetrospectiveAction(year),
  });

  useEffect(() => {
    if (initialFriendsOverview) {
      setFriendsOverview(initialFriendsOverview);
      setFriendsStatus("ready");
      friendsLoadedRef.current = true;
    }
  }, [initialFriendsOverview]);

  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [visitorAudience, setVisitorAudience] =
    useState<VisitorAudience>("public");
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

  // Sync URL params (incluindo reset de ?collection=artifacts ao voltar para /profile limpo)
  useEffect(() => {
    setActiveTab(resolveShowcaseTab(urlTabParam));
    setActiveCollectionTab(
      resolveShowcaseCollectionTab(urlCollectionParam, urlTabParam),
    );
  }, [urlTabParam, urlCollectionParam]);

  useEffect(() => {
    setHighlights(initialShowcase.highlights || []);
  }, [initialShowcase.highlights]);

  const ensureFriendsLoaded = useCallback(async (force = false) => {
    if (!force && friendsLoadedRef.current) return;
    friendsLoadedRef.current = true;
    setFriendsStatus("loading");
    try {
      const res = await getFriendsOverviewAction();
      if (res.success && res.data) {
        setFriendsOverview(res.data);
        setFriendsStatus("ready");
      } else {
        friendsLoadedRef.current = false;
        setFriendsStatus("error");
      }
    } catch {
      friendsLoadedRef.current = false;
      setFriendsStatus("error");
    }
  }, []);

  const handleRequestRetrospective = useCallback(() => {
    if (retroStatus === "loading") return;
    void ensureRetrospectiveLoaded(retroStatus === "error");
  }, [ensureRetrospectiveLoaded, retroStatus]);

  // Carrega dados de Amigos / Retrospectiva sob demanda ao entrar nas abas
  useEffect(() => {
    if (activeTab === "friends" || activeTab === "progression") {
      if (friendsStatus === "idle") {
        void ensureFriendsLoaded();
      }
    } else if (activeTab === "retrospective") {
      if (retroStatus === "idle") {
        void ensureRetrospectiveLoaded();
      }
    }
  }, [
    activeTab,
    friendsStatus,
    retroStatus,
    ensureFriendsLoaded,
    ensureRetrospectiveLoaded,
  ]);

  const markedAchievementIdsRef = useRef<Set<string>>(new Set());
  const markedArtifactIdsRef = useRef<Set<string>>(new Set());
  const isUnpinningRef = useRef(false);

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

    let cancelled = false;
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    if (activeCollectionTab === "achievements") {
      const unseenIds = (initialShowcase.achievements ?? [])
        .filter(
          (a) =>
            a.unlocked && !a.seen && !markedAchievementIdsRef.current.has(a.id),
        )
        .map((a) => a.id);

      if (unseenIds.length > 0) {
        for (const id of unseenIds) {
          markedAchievementIdsRef.current.add(id);
        }
        void markAchievementsSeenAction().then((res) => {
          if (cancelled) return;
          if (!res.success) {
            for (const id of unseenIds) {
              markedAchievementIdsRef.current.delete(id);
            }
            return;
          }
          dismissTimer = globalThis.setTimeout(() => {
            if (!cancelled) {
              setAchievementsSeenDismissed(true);
            }
          }, 1500);
        });
      }
    }

    if (activeCollectionTab === "artifacts") {
      const unseenIds = (initialShowcase.artifacts ?? [])
        .filter(
          (a) =>
            a.unlocked && !a.seen && !markedArtifactIdsRef.current.has(a.id),
        )
        .map((a) => a.id);

      if (unseenIds.length > 0) {
        for (const id of unseenIds) {
          markedArtifactIdsRef.current.add(id);
        }
        void markArtifactsSeenAction().then((res) => {
          if (cancelled) return;
          if (!res.success) {
            for (const id of unseenIds) {
              markedArtifactIdsRef.current.delete(id);
            }
            return;
          }
          dismissTimer = globalThis.setTimeout(() => {
            if (!cancelled) {
              setArtifactsSeenDismissed(true);
            }
          }, 1500);
        });
      }
    }

    return () => {
      cancelled = true;
      if (dismissTimer) {
        globalThis.clearTimeout(dismissTimer);
      }
    };
  }, [
    isVisitorMode,
    activeTab,
    activeCollectionTab,
    initialShowcase.achievements,
    initialShowcase.artifacts,
  ]);

  const storeUser = useUserStore((s) => s.user);
  const storeFrameId = useActiveAvatarFrame();
  const resolvedUser = useResolvedUser(initialShowcase.user);
  const activeFrameId =
    storeUser && storeUser.id === initialShowcase.user.id
      ? storeFrameId
      : resolveUserAvatarFrame(
          resolvedUser?.avatarFrame,
          Boolean(resolvedUser?.isPremium),
        );

  // Simulação fiel de Visão de Visitante baseada na privacidade real do usuário
  const simulatedCanViewProfile =
    !isVisitorMode ||
    canAudienceViewVisibility(resolvedUser.profileVisibility, visitorAudience);
  const simulatedCanViewStats =
    !isVisitorMode ||
    (simulatedCanViewProfile &&
      canAudienceViewVisibility(resolvedUser.statsVisibility, visitorAudience));
  const simulatedCanViewAchievements =
    !isVisitorMode ||
    (simulatedCanViewProfile &&
      canAudienceViewVisibility(
        resolvedUser.achievementsVisibility,
        visitorAudience,
      ));

  // Ajusta aba ativa e query URL caso o modo visitante oculte a aba atual
  useEffect(() => {
    if (!isVisitorMode) return;
    if (
      activeTab === "friends" ||
      !simulatedCanViewProfile ||
      ((activeTab === "progression" || activeTab === "retrospective") &&
        !simulatedCanViewStats)
    ) {
      setActiveTab("overview");
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.has("tab")) {
          params.delete("tab");
          const query = params.toString();
          const nextUrl = query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname;
          window.history.replaceState(window.history.state, "", nextUrl);
        }
      }
    }
  }, [
    isVisitorMode,
    activeTab,
    simulatedCanViewProfile,
    simulatedCanViewStats,
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
    if (activeCollectionTab === "achievements" && tab !== "achievements") {
      setAchievementsSeenDismissed(true);
    }
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

  const handleQuickUnpinHighlight = async (
    type: "ACHIEVEMENT" | "ARTIFACT",
    id: string,
    code: string,
  ) => {
    if (isUnpinningRef.current) return;
    isUnpinningRef.current = true;

    const remaining: HighlightSlotInputDTO[] = highlights
      .filter(
        (h) =>
          !(
            h.highlightType === type &&
            (h.referenceId === id || h.highlightKey === code)
          ),
      )
      .map((h) => ({
        displayOrder: h.displayOrder,
        highlightType: h.highlightType,
        referenceId: h.referenceId,
        highlightKey: h.highlightKey,
      }));

    const previous = highlights;
    setHighlights((prev) =>
      prev.filter(
        (h) =>
          !(
            h.highlightType === type &&
            (h.referenceId === id || h.highlightKey === code)
          ),
      ),
    );

    try {
      const res = await updateMyHighlightsAction({ highlights: remaining });
      if (!res.success) {
        setHighlights(previous);
        toast.error(res.error);
        return;
      }
      if (res.data) {
        setHighlights(res.data);
      }
      toast.success(t("pickerModal.unpinnedToast"));
    } finally {
      isUnpinningRef.current = false;
    }
  };

  const handleOpenPreviewCard = (mode: "profile" | "retrospective") => {
    if (mode === "retrospective") {
      const targetYear = initialShowcase.seasonalRetroYear ?? undefined;
      const hasMatchingRetro =
        Boolean(activeRetrospective?.eligible) &&
        (!targetYear || activeRetrospective?.year === targetYear);

      if (!hasMatchingRetro) {
        void ensureRetrospectiveLoaded(true, targetYear).then((loaded) => {
          setPreviewModalState({
            isOpen: true,
            mode: loaded?.eligible ? "retrospective" : "profile",
            retro: loaded,
          });
        });
        return;
      }
    }
    setPreviewModalState({
      isOpen: true,
      mode,
      retro: activeRetrospective,
    });
  };

  const friendsCount =
    friendsOverview?.friendsCount ?? initialShowcase.friendsCount ?? 0;
  const pendingRequestsCount =
    friendsOverview?.incomingRequests.length ??
    initialShowcase.pendingFriendRequestsCount ??
    0;

  const seasonalRetroYear =
    (activeRetrospective?.eligible && activeRetrospective.inSeasonalWindow
      ? activeRetrospective.year
      : null) ??
    initialShowcase.seasonalRetroYear ??
    null;
  const matchingSeasonalRetro =
    activeRetrospective?.eligible &&
    seasonalRetroYear !== null &&
    activeRetrospective.year === seasonalRetroYear
      ? activeRetrospective
      : null;
  const showSeasonalRetroBanner =
    !isVisitorMode &&
    Boolean(
      (activeRetrospective?.eligible && activeRetrospective.inSeasonalWindow) ||
        initialShowcase.hasSeasonalRetroBanner,
    );

  const seasonalArchetypeTitle = matchingSeasonalRetro
    ? isGamified
      ? t(`retrospective.archetypes.${matchingSeasonalRetro.archetype}.title`)
      : t(
          `retrospective.archetypes.${matchingSeasonalRetro.archetype}.essentialTitle`,
        )
    : "";

  const tabs: ShowcaseTabItem<ShowcaseTabId>[] = [
    { id: "overview", label: t("tabs.overview"), icon: Trophy },
    ...(simulatedCanViewStats
      ? [
          {
            id: "progression" as const,
            label: t("tabs.progression"),
            icon: Mountain,
            onPreload: preloadProgressionPanel,
          },
        ]
      : []),
    ...(!isVisitorMode
      ? [
          {
            id: "friends" as const,
            label: t("tabs.friends", { count: friendsCount }),
            icon: Users,
            badge:
              pendingRequestsCount > 0
                ? t("tabs.friendsPending", { count: pendingRequestsCount })
                : undefined,
            onPreload: preloadFriendsPanel,
          },
        ]
      : []),
    ...(simulatedCanViewStats
      ? [
          {
            id: "retrospective" as const,
            label: t("tabs.retrospective"),
            icon: Sparkles,
            onPreload: preloadRetrospectivePanel,
          },
        ]
      : []),
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

  // Filtra destaques visíveis na simulação de Visão de Visitante conforme privacidade
  const displayedHighlights = useMemo(() => {
    if (!isVisitorMode) return highlights;
    return highlights.filter((h) => {
      if (
        !simulatedCanViewAchievements &&
        (h.highlightType === "ACHIEVEMENT" || h.highlightType === "ARTIFACT")
      ) {
        return false;
      }
      if (
        !simulatedCanViewStats &&
        (h.highlightType === "STAT_METRIC" ||
          h.highlightType === "TASK_STREAK" ||
          (h.highlightType === "ACCOUNT_BADGE" &&
            h.highlightKey === "LEVEL_RANK"))
      ) {
        return false;
      }
      return true;
    });
  }, [
    isVisitorMode,
    highlights,
    simulatedCanViewAchievements,
    simulatedCanViewStats,
  ]);

  const displayedStats = useMemo(() => {
    if (!isVisitorMode || simulatedCanViewStats) {
      return initialShowcase.stats;
    }
    return {
      ...createEmptyShowcaseData(resolvedUser).stats,
      currentStreak: 0,
      highestStreak: 0,
      totalXp: 0,
      highestTaskStreak: 0,
      highestTaskStreakTitle: null,
      achievementPoints: simulatedCanViewAchievements
        ? initialShowcase.stats.achievementPoints
        : 0,
      unlockedAchievementsCount: simulatedCanViewAchievements
        ? initialShowcase.stats.unlockedAchievementsCount
        : 0,
      totalAchievementsCount: simulatedCanViewAchievements
        ? initialShowcase.stats.totalAchievementsCount
        : 0,
      unlockedArtifactsCount: simulatedCanViewAchievements
        ? initialShowcase.stats.unlockedArtifactsCount
        : 0,
      totalArtifactsCount: simulatedCanViewAchievements
        ? initialShowcase.stats.totalArtifactsCount
        : 0,
    };
  }, [
    isVisitorMode,
    simulatedCanViewStats,
    simulatedCanViewAchievements,
    initialShowcase.stats,
    resolvedUser,
  ]);

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
        stats={displayedStats}
        achievements={initialShowcase.achievements}
        unlockedArtifactsCount={unlockedArtifactsCount}
        retrospective={activeRetrospective}
        eligibleRetroArchetypes={initialShowcase.eligibleRetroArchetypes}
        isVisitorMode={isVisitorMode}
        visitorAudience={visitorAudience}
        onVisitorAudienceChange={setVisitorAudience}
        onToggleVisitorMode={() => setIsVisitorMode((prev) => !prev)}
        hideStats={!simulatedCanViewStats}
        hideAchievements={!simulatedCanViewAchievements}
        onOpenProgression={
          simulatedCanViewStats
            ? () => handleSelectTab("progression")
            : undefined
        }
        onPreloadPreviewCard={preloadPreviewCardModal}
        onOpenPreviewCard={() => handleOpenPreviewCard("profile")}
        onRequestRetrospective={handleRequestRetrospective}
      />

      {!simulatedCanViewProfile ? (
        <PrivateProfileNotice
          title={tPublic("privateProfileTitle")}
          description={
            resolvedUser.profileVisibility === "FRIENDS_ONLY"
              ? tPublic("privateProfileFriendsDesc")
              : tPublic("privateProfilePrivateDesc")
          }
        />
      ) : (
        <>
          {/* NAVEGAÇÃO DE ABAS DO PERFIL */}
          <ShowcaseTabs
            baseId={tabsBaseId}
            ariaLabel={t("tabs.navAria")}
            tabs={tabs}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />

          {/* ABA 1: VITRINE & CONQUISTAS */}
          {activeTab === "overview" && (
            <ShowcaseOverviewLayout
              panelId={overviewIds.panelId}
              labelledById={overviewIds.tabId}
              bannerSlot={
                showSeasonalRetroBanner && seasonalRetroYear ? (
                  <section className="rounded-2xl border border-amber-500/45 dark:border-gold/45 bg-gradient-to-r from-amber-500/15 via-primary/15 to-surface/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
                        <Sparkles size={20} aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-body-m font-extrabold text-neutral-50">
                          {t("header.retrospectiveBannerTitle", {
                            year: seasonalRetroYear,
                          })}
                        </h2>
                        <p className="text-xs text-neutral-300 mt-0.5">
                          {matchingSeasonalRetro
                            ? t("header.retrospectiveBannerDesc", {
                                days: matchingSeasonalRetro.activeDays,
                                tasks: matchingSeasonalRetro.tasksCompleted,
                                archetype: seasonalArchetypeTitle,
                              })
                            : t("header.retrospectiveBannerCompactDesc", {
                                year: seasonalRetroYear,
                              })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onMouseEnter={preloadPreviewCardModal}
                        onFocus={preloadPreviewCardModal}
                        onClick={() => handleOpenPreviewCard("retrospective")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer"
                      >
                        <Download size={14} aria-hidden="true" />
                        <span>{t("header.retrospectiveBannerBtn")}</span>
                      </button>
                    </div>
                  </section>
                ) : undefined
              }
              user={resolvedUser}
              stats={displayedStats}
              highlights={displayedHighlights}
              achievements={initialShowcase.achievements}
              artifacts={artifactsList}
              taskStreaks={taskStreaksList}
              isVisitorMode={isVisitorMode}
              canViewStats={simulatedCanViewStats}
              canViewAchievements={simulatedCanViewAchievements}
              statsSlot={
                statsSlot ? (
                  <ShowcaseStatsVisibilityProvider
                    canViewAchievements={simulatedCanViewAchievements}
                  >
                    {statsSlot}
                  </ShowcaseStatsVisibilityProvider>
                ) : undefined
              }
              onOpenPicker={handleOpenPicker}
              onPreloadPicker={preloadHighlightPickerModal}
              activeCollection={activeCollectionTab}
              onSelectCollection={handleSelectCollectionTab}
              onPinAchievement={handlePinAchievementFromGallery}
              onUnpinAchievement={(ach) =>
                void handleQuickUnpinHighlight("ACHIEVEMENT", ach.id, ach.code)
              }
              onPinArtifact={handlePinArtifactFromGallery}
              onUnpinArtifact={(art) =>
                void handleQuickUnpinHighlight("ARTIFACT", art.id, art.code)
              }
              totalAchievementsCount={
                initialShowcase.stats.totalAchievementsCount
              }
              totalArtifactsCount={initialShowcase.stats.totalArtifactsCount}
              achievementsSeenDismissed={achievementsSeenDismissed}
              artifactsSeenDismissed={artifactsSeenDismissed}
            />
          )}

          {/* ABA 2: PIRÂMIDE DE PROGRESSÃO & PATENTES */}
          {activeTab === "progression" && simulatedCanViewStats && (
            <div
              id={progressionIds.panelId}
              role="tabpanel"
              aria-labelledby={progressionIds.tabId}
            >
              <ProgressionPyramidPanel
                user={resolvedUser}
                stats={initialShowcase.stats}
                achievements={
                  simulatedCanViewAchievements
                    ? initialShowcase.achievements
                    : []
                }
                friends={friendsOverview?.friends ?? EMPTY_FRIENDS}
                activeFrameId={activeFrameId}
                isVisitorMode={isVisitorMode}
              />
            </div>
          )}

          {/* ABA 3: REDE SOCIAL & AMIGOS */}
          {activeTab === "friends" && !isVisitorMode && (
            <div
              id={friendsIds.panelId}
              role="tabpanel"
              aria-labelledby={friendsIds.tabId}
            >
              {!friendsOverview &&
              (friendsStatus === "idle" || friendsStatus === "loading") ? (
                <ShowcaseTabPanelFallback />
              ) : friendsStatus === "error" && !friendsOverview ? (
                <section
                  role="alert"
                  className="rounded-2xl border border-red-500/35 bg-card dark:bg-surface/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <p className="text-body-s text-neutral-200">
                    {t("friends.loadError")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void ensureFriendsLoaded(true)}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    {t("errorState.retry")}
                  </button>
                </section>
              ) : (
                <FriendsNetworkPanel
                  initialOverview={friendsOverview}
                  onOverviewUpdated={setFriendsOverview}
                />
              )}
            </div>
          )}

          {/* ABA 4: RETROSPECTIVA ANUAL */}
          {activeTab === "retrospective" && simulatedCanViewStats && (
            <div
              id={retrospectiveIds.panelId}
              role="tabpanel"
              aria-labelledby={retrospectiveIds.tabId}
            >
              <RetrospectivePanel
                initialRetrospective={activeRetrospective}
                isLoading={isRetroLoading}
                loadError={isRetroLoadError}
                onRetry={() => void ensureRetrospectiveLoaded(true)}
                isGamified={isGamified}
                isOwnProfile={!isVisitorMode}
                onRetrospectiveChange={setActiveRetrospectiveData}
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
        </>
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
