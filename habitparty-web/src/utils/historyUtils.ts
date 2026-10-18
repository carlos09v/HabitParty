import { FOCUS_ICONS } from "@/constants/focus";
import {
  DEFAULT_TRANSACTION_STYLE,
  DIFFICULTY_LABELS,
  PACKAGE_LABELS,
  TRANSACTION_TYPE_CONFIG,
} from "@/constants/history";
import { REWARD_ICONS } from "@/constants/reward";
import { getColumnIcon } from "@/constants/routine";
import type {
  TransactionHistoryResponseDTO,
  TransactionMetadata,
} from "@/types/history";
import { formatDateTime } from "@/utils";

/**
 * Resolve e normaliza com alta performance todos os metadados visuais e contextuais
 * de uma transação do histórico (tipo resolvido, rótulos, ícone correto e classes Tailwind).
 */
export function resolveTransactionMetadata(
  transaction: TransactionHistoryResponseDTO,
  taskTypeMap?: Record<string, string>,
): TransactionMetadata {
  const isFocus = transaction.transactionType === "FOCUS_COMPLETED";
  let resolvedType: string = transaction.transactionType || "TASK_COMPLETED";

  // Fallback para transações legadas que possam ter sido salvas genericamente como TASK_COMPLETED
  if (resolvedType === "TASK_COMPLETED") {
    const mappedType =
      (transaction.referenceId && taskTypeMap?.[transaction.referenceId]) ||
      (transaction.name &&
        taskTypeMap?.[transaction.name.trim().toLowerCase()]);
    const upperMapped = mappedType?.toUpperCase();

    if (upperMapped === "HABIT") {
      resolvedType = "HABIT_COMPLETED";
    } else if (upperMapped === "DAILY") {
      resolvedType = "DAILY_COMPLETED";
    } else if (upperMapped === "TODO") {
      resolvedType = "TODO_COMPLETED";
    } else if (transaction.tags && transaction.tags.length > 0) {
      const lowerTags = transaction.tags.map((t) => t.toLowerCase());
      if (lowerTags.some((t) => t.includes("habit") || t.includes("hábito"))) {
        resolvedType = "HABIT_COMPLETED";
      } else if (
        lowerTags.some(
          (t) =>
            t.includes("daily") || t.includes("diária") || t.includes("diaria"),
        )
      ) {
        resolvedType = "DAILY_COMPLETED";
      }
    }
  }

  const typeConfig =
    TRANSACTION_TYPE_CONFIG[resolvedType] || DEFAULT_TRANSACTION_STYLE;

  // 2. Resolução de ícone customizado
  let IconComponent = typeConfig.icon;
  if (isFocus) {
    if (transaction.icon) {
      const found = FOCUS_ICONS.find(
        (i) => i.id.toLowerCase() === transaction.icon?.toLowerCase(),
      );
      if (found) {
        IconComponent = found.icon;
      }
    }
  } else if (transaction.icon) {
    const iconId = transaction.icon.trim().toLowerCase();
    const rewardFound = REWARD_ICONS.find(
      (item) => item.id.toLowerCase() === iconId,
    );
    if (rewardFound) {
      IconComponent = rewardFound.icon;
    } else {
      const colIcon = getColumnIcon(transaction.icon);
      if (colIcon) {
        IconComponent = colIcon;
      }
    }
  }

  // 3. Rótulos de dificuldade e pacote
  const difficultyLabel = transaction.difficulty
    ? DIFFICULTY_LABELS[transaction.difficulty] || transaction.difficulty
    : null;

  const packageLabel =
    transaction.packageLevel && transaction.packageLevel !== "NONE"
      ? PACKAGE_LABELS[transaction.packageLevel] || transaction.packageLevel
      : null;

  // 4. Formatação de data
  const formattedDate = formatDateTime(transaction.createdAt);

  return {
    label: typeConfig.label,
    badgeClass: typeConfig.badgeClass,
    borderClass: typeConfig.borderClass,
    icon: IconComponent,
    isFocus,
    resolvedType,
    difficultyLabel,
    packageLabel,
    formattedDate,
  };
}
