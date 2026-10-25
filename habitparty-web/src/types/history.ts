import type { LucideIcon } from "lucide-react";
import type { components } from "@/api/schema";

export type PageTransactionHistoryResponseDTO =
  components["schemas"]["PageTransactionHistoryResponseDTO"];

export type TransactionHistoryResponseDTO =
  components["schemas"]["TransactionHistoryResponseDTO"];

export type HistoryTabId = "ALL" | "TASKS" | "SHOPPING" | "BACKPACK" | "FOCUS";

export type HistoryPeriodFilter = "ALL" | "TODAY" | "7DAYS" | "30DAYS";

export interface HistoryTab {
  id: HistoryTabId;
  label: string;
}

export interface TransactionTypeStyle {
  label: string;
  borderClass: string;
  badgeClass: string;
  icon: LucideIcon;
}

export interface TransactionMetadata {
  label: string;
  badgeClass: string;
  borderClass: string;
  icon: LucideIcon;
  isFocus: boolean;
  resolvedType: string;
  difficultyLabel: string | null;
  packageLabel: string | null;
  formattedDate: string;
  formattedTime: string;
}

export interface TransactionDayGroup {
  dateKey: string;
  label: string;
  items: TransactionHistoryResponseDTO[];
}

export interface HistoryPageSummary {
  goldEarned: number;
  goldSpent: number;
  xpEarned: number;
  totalCount: number;
}
