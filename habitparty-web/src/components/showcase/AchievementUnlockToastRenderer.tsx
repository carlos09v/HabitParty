import { Sparkles, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { getRarityTheme } from "@/constants/achievements";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementItemResponseDTO,
  AchievementRarity,
} from "@/types/showcase";
import { cn } from "@/utils/cn";
import {
  resolveAchievementCopy,
  resolveArtifactCopy,
} from "@/utils/showcaseUtils";
import { soundEffects } from "@/utils/soundEffects";

const RARITY_PRIORITY: Record<AchievementRarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
};

type MessageDictionary = {
  [key: string]: string | MessageDictionary;
};

interface ShowcaseCatalogMessages {
  catalog?: MessageDictionary;
  artifactItems?: MessageDictionary;
}

const loadedCatalogCache = new Map<AppLocale, ShowcaseCatalogMessages>();

async function loadShowcaseCatalogMessages(
  locale: AppLocale,
): Promise<ShowcaseCatalogMessages> {
  const cached = loadedCatalogCache.get(locale);
  if (cached) return cached;
  try {
    const mod =
      locale === "en"
        ? await import("@/messages/en/showcaseCatalog.json")
        : await import("@/messages/pt-BR/showcaseCatalog.json");
    const catalogData = (mod.default ?? {}) as ShowcaseCatalogMessages;
    loadedCatalogCache.set(locale, catalogData);
    return catalogData;
  } catch {
    return {};
  }
}

function resolveDictionaryValue(
  dict: MessageDictionary | undefined,
  key: string,
): string | undefined {
  if (!dict || !key) return undefined;
  let current: string | MessageDictionary | undefined = dict;
  for (const segment of key.split(".")) {
    if (
      !segment ||
      current === null ||
      typeof current !== "object" ||
      !Object.hasOwn(current, segment)
    ) {
      return undefined;
    }
    current = current[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function createDictionaryTranslator(dict?: MessageDictionary) {
  const fn = (key: string): string => resolveDictionaryValue(dict, key) ?? key;
  fn.has = (key: string): boolean =>
    resolveDictionaryValue(dict, key) !== undefined;
  return fn;
}

export interface RenderAchievementToastsOptions {
  achievements: AchievementItemResponseDTO[];
  locale: AppLocale;
  isGamified: boolean;
  onNavigateProfile: () => void;
  tToast: (key: string, values?: Record<string, string | number>) => string;
  tRarities: (key: AchievementRarity) => string;
}

export async function renderAchievementUnlockToasts({
  achievements,
  locale,
  isGamified,
  onNavigateProfile,
  tToast,
  tRarities,
}: RenderAchievementToastsOptions): Promise<void> {
  if (achievements.length === 0) return;

  let highestRarity: AchievementRarity = "COMMON";
  for (const item of achievements) {
    if (RARITY_PRIORITY[item.rarity] > RARITY_PRIORITY[highestRarity]) {
      highestRarity = item.rarity;
    }
  }

  soundEffects.playAchievementUnlockSound(highestRarity);

  const showcaseMessages = await loadShowcaseCatalogMessages(locale);
  const tCatalog = createDictionaryTranslator(showcaseMessages.catalog);
  const tArtifacts = createDictionaryTranslator(
    showcaseMessages.artifactItems
      ? { items: showcaseMessages.artifactItems }
      : undefined,
  );

  achievements.slice(0, 3).forEach((achievement) => {
    const theme = getRarityTheme(achievement.rarity);
    const { title, description } = resolveAchievementCopy(
      achievement,
      isGamified,
      tCatalog,
    );
    const rarityLabel = tRarities(achievement.rarity);
    const grantedArtifact = achievement.grantedArtifact;
    const artifactTheme = grantedArtifact
      ? getRarityTheme(grantedArtifact.rarity)
      : null;
    const artifactCopy = grantedArtifact
      ? resolveArtifactCopy(grantedArtifact, isGamified, tArtifacts)
      : null;

    toast.custom(
      (toastId) => (
        <article
          className={cn(
            "w-full max-w-md rounded-2xl border p-4 shadow-card-active dark:shadow-2xl transition-colors motion-reduce:transition-none",
            "bg-card dark:bg-neutral-900/95",
            theme.cardBorder,
            theme.cardGlow,
          )}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                theme.iconBg,
                theme.iconText,
              )}
            >
              <AchievementIcon iconKey={achievement.iconName} size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                    <Sparkles size={11} aria-hidden="true" />
                    {isGamified
                      ? tToast("headerGamified")
                      : tToast("headerEssential")}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border",
                      theme.badgeBg,
                      theme.badgeText,
                      theme.badgeBorder,
                    )}
                  >
                    {rarityLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toast.dismiss(toastId)}
                  aria-label={tToast("dismiss")}
                  className="p-1 -mr-1 -mt-1 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/60 transition-colors shrink-0 cursor-pointer"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              <p className="text-body-s font-bold text-neutral-50 mt-0.5 break-words">
                {title}
              </p>
              <p className="text-tiny text-neutral-300 mt-0.5 break-words">
                {description}
              </p>

              {grantedArtifact && artifactTheme && artifactCopy && (
                <div
                  className={cn(
                    "mt-2.5 flex items-center gap-2.5 rounded-xl border px-2.5 py-2",
                    "bg-neutral-800/50 dark:bg-neutral-950/60",
                    artifactTheme.cardBorder,
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
                      artifactTheme.iconBg,
                      artifactTheme.iconText,
                    )}
                  >
                    <AchievementIcon
                      iconKey={grantedArtifact.iconName}
                      size={16}
                      fallback="sparkles"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-gold break-words">
                        {tToast("artifactGrantedLabel")}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border",
                          artifactTheme.badgeBg,
                          artifactTheme.badgeText,
                          artifactTheme.badgeBorder,
                        )}
                      >
                        {tRarities(grantedArtifact.rarity)}
                      </span>
                    </div>
                    <p className="text-tiny font-bold text-neutral-50 break-words">
                      {artifactCopy.name}
                    </p>
                    <p className="text-[11px] text-neutral-300 break-words">
                      {tToast("artifactAddedHint")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-neutral-700 dark:border-primary/15">
                <span className="inline-flex items-center gap-1 text-tiny font-bold text-amber-700 dark:text-gold">
                  <Trophy size={12} aria-hidden="true" />
                  {tToast("pointsEarned", { points: achievement.points })}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(toastId);
                    onNavigateProfile();
                  }}
                  className="text-tiny font-bold text-primary dark:text-gold hover:underline cursor-pointer"
                >
                  {tToast("viewShowcase")} →
                </button>
              </div>
            </div>
          </div>
        </article>
      ),
      { duration: 6500 },
    );
  });

  if (achievements.length > 3) {
    const remaining = achievements.slice(3);
    const remainingPoints = remaining.reduce(
      (sum, item) => sum + item.points,
      0,
    );
    toast.custom(
      (toastId) => (
        <article className="w-full max-w-md rounded-2xl border border-gold/40 p-4 shadow-card-active dark:shadow-2xl bg-card dark:bg-neutral-900/95">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl border border-gold/40 bg-gold/15 text-amber-700 dark:text-gold flex items-center justify-center shrink-0">
              <Trophy size={20} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-body-s font-bold text-neutral-50 break-words">
                  {tToast("moreUnlockedTitle", { count: remaining.length })}
                </p>
                <button
                  type="button"
                  onClick={() => toast.dismiss(toastId)}
                  aria-label={tToast("dismiss")}
                  className="p-1 -mr-1 -mt-1 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/60 transition-colors shrink-0 cursor-pointer"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              <p className="text-tiny text-neutral-300 mt-0.5 break-words">
                {tToast("moreUnlockedDesc")}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-neutral-700 dark:border-primary/15">
                <span className="inline-flex items-center gap-1 text-tiny font-bold text-amber-700 dark:text-gold">
                  <Trophy size={12} aria-hidden="true" />
                  {tToast("pointsEarned", { points: remainingPoints })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(toastId);
                    onNavigateProfile();
                  }}
                  className="text-tiny font-bold text-primary dark:text-gold hover:underline cursor-pointer"
                >
                  {tToast("viewShowcase")} →
                </button>
              </div>
            </div>
          </div>
        </article>
      ),
      { duration: 6500 },
    );
  }
}
