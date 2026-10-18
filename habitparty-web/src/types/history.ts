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
}

export interface HistoryContainerProps {
  pageData: PageTransactionHistoryResponseDTO;
  currentTab: string;
  currentPage: number;
  currentPeriod?: HistoryPeriodFilter;
  currentSearch?: string;
  isCompact?: boolean;
  taskTypeMap?: Record<string, string>;
}

export interface HistoryTableProps {
  transactions: TransactionHistoryResponseDTO[];
  isCompact?: boolean;
  onDelete?: (id: string) => void;
  taskTypeMap?: Record<string, string>;
}

export interface HistoryRowProps {
  transaction: TransactionHistoryResponseDTO;
  isCompact?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  taskTypeMap?: Record<string, string>;
}

export interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionHistoryResponseDTO | null;
  onDelete?: (id: string) => Promise<void> | void;
}
