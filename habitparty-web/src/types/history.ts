import type { LucideIcon } from "lucide-react";
import type { components } from "@/api/schema";

export type PageTransactionHistoryResponseDTO =
  components["schemas"]["PageTransactionHistoryResponseDTO"];

export type TransactionHistoryResponseDTO =
  components["schemas"]["TransactionHistoryResponseDTO"];

export type HistoryTabId = "ALL" | "TASKS" | "SHOPPING" | "BACKPACK";

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

export interface HistoryContainerProps {
  pageData: PageTransactionHistoryResponseDTO;
  currentTab: string;
  currentPage: number;
  isCompact?: boolean;
}

export interface HistoryTableProps {
  transactions: TransactionHistoryResponseDTO[];
  isCompact?: boolean;
  onDelete?: (id: string) => void;
}

export interface HistoryRowProps {
  transaction: TransactionHistoryResponseDTO;
  isCompact?: boolean;
  onDelete?: (id: string) => void;
}
