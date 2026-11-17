"use client";

import { Download, Sparkles, Trophy, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { markAchievementsSeenAction } from "@/actions/showcaseActions";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import { FriendsNetworkPanel } from "@/components/showcase/FriendsNetworkPanel";
import { RetrospectivePanel } from "@/components/showcase/RetrospectivePanel";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
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
  FriendsOverviewData,
  UserRetrospectiveData,
} from "@/types/social";
import { cn, resolveShowcaseTab, type ShowcaseTabId } from "@/utils";

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

  useEffect(() => {
    if (urlTabParam) {
      setActiveTab(resolveShowcaseTab(urlTabParam));
    }
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
        user={initialShowcase.user}
        stats={initialShowcase.stats}
        isVisitorMode={isVisitorMode}
        onToggleVisitorMode={() => setIsVisitorMode((prev) => !prev)}
        onOpenPreviewCard={() =>
          setPreviewModalState({
            isOpen: true,
            mode: "profile",
            retro: initialRetrospective,
          })
        }
      />

      {/* NAVEGAÇÃO DE ABAS DO PERFIL: VITRINE | AMIGOS | RETROSPECTIVA */}
      <div
        role="tablist"
        aria-label={t("tabs.navAria")}
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface dark:bg-surface/90 border border-neutral-700 dark:border-primary/20 overflow-x-auto custom-scrollbar"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          onClick={() => handleSelectTab("overview")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer",
            activeTab === "overview"
              ? "bg-gold text-on-gold shadow-glow-gold-xs"
              : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
          )}
        >
          <Trophy size={15} aria-hidden="true" />
          <span>{t("tabs.overview")}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "friends"}
          onClick={() => handleSelectTab("friends")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer",
            activeTab === "friends"
              ? "bg-gold text-on-gold shadow-glow-gold-xs"
              : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
          )}
        >
          <Users size={15} aria-hidden="true" />
          <span>{t("tabs.friends", { count: friendsCount })}</span>
          {pendingRequestsCount > 0 && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                activeTab === "friends"
                  ? "bg-black/20 text-on-gold"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40",
              )}
            >
              {t("tabs.friendsPending", { count: pendingRequestsCount })}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "retrospective"}
          onClick={() => handleSelectTab("retrospective")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer",
            activeTab === "retrospective"
              ? "bg-gold text-on-gold shadow-glow-gold-xs"
              : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
          )}
        >
          <Sparkles size={15} aria-hidden="true" />
          <span>{t("tabs.retrospective")}</span>
        </button>
      </div>

      {/* ABA 1: VITRINE & CONQUISTAS */}
      {activeTab === "overview" && (
        <div role="tabpanel" className="flex flex-col gap-7">
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
            user={initialShowcase.user}
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

      {/* ABA 2: REDE SOCIAL & AMIGOS */}
      {activeTab === "friends" && (
        <div role="tabpanel">
          <FriendsNetworkPanel initialOverview={initialFriendsOverview} />
        </div>
      )}

      {/* ABA 3: RETROSPECTIVA ANUAL */}
      {activeTab === "retrospective" && (
        <div role="tabpanel">
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
          user={initialShowcase.user}
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
