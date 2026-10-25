"use client";

import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
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
  const welcomeDetails = WELCOME_CARD_DETAILS.history;
  if (!welcomeDetails) return null;

  const stats = summary
    ? calculateHistoryWelcomeStats(summary)
    : calculateHistoryWelcomeStats(transactions, totalElements);

  return (
    <WelcomeCard
      compact={isCompact}
      title={welcomeDetails.title}
      subtitle={welcomeDetails.subtitle}
      bullets={welcomeDetails.bullets}
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
