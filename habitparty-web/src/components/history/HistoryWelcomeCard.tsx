"use client";

import { useLocale, useTranslations } from "next-intl";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type {
  HistoryPageSummary,
  TransactionHistoryResponseDTO,
} from "@/types/history";
import { calculateHistoryWelcomeStats } from "@/utils/historyUtils";

interface HistoryWelcomeCardProps {
  summary?: HistoryPageSummary;
  transactions?: TransactionHistoryResponseDTO[];
  totalElements?: number;
  isCompact?: boolean;
}

export function HistoryWelcomeCard({
  summary,
  transactions = [],
  totalElements,
  isCompact = false,
}: HistoryWelcomeCardProps) {
  const t = useTranslations("history.welcomeCard");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const welcomeDetails = WELCOME_CARD_DETAILS.history;
  if (!welcomeDetails) return null;

  const stats = summary
    ? calculateHistoryWelcomeStats(summary, locale, locale, isGamified)
    : calculateHistoryWelcomeStats(
        transactions,
        totalElements,
        locale,
        isGamified,
      );

  const title = isGamified ? t("titleGamified") : t("titleProductivity");
  const subtitle = isGamified
    ? t("subtitleGamified")
    : t("subtitleProductivity");
  const bullet0 = isGamified ? t("bullet0") : t("bullet0Productivity");
  const bullet2 = isGamified ? t("bullet2Gamified") : t("bullet2Productivity");

  return (
    <WelcomeCard
      compact={isCompact}
      title={title}
      subtitle={subtitle}
      bullets={[bullet0, t("bullet1"), bullet2]}
      imageSrc={welcomeDetails.imageSrc}
      stats={stats}
      imageWidth={
        isCompact ? welcomeDetails.compactWidth : welcomeDetails.normalWidth
      }
      imageHeight={
        isCompact ? welcomeDetails.compactHeight : welcomeDetails.normalHeight
      }
      storageKey="history"
    />
  );
}
