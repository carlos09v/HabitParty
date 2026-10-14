import type { EconomyBarData } from "@/types/dashboard";
import type { TransactionHistoryResponseDTO } from "@/types/history";

export interface WeeklyEarningsResult {
  bars: EconomyBarData[];
  currentWeekEarnings: number;
}

function formatPeriodRange(startDate: Date): string {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const startDay = String(startDate.getDate()).padStart(2, "0");
  const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");

  if (startMonth === endMonth) {
    return `${startDay} a ${endDay}/${startMonth}`;
  }
  return `${startDay}/${startMonth} a ${endDay}/${endMonth}`;
}

/**
 * Calcula os ganhos semanais de moedas provenientes de tarefas concluídas (TASK_COMPLETED).
 * Agrupa os dados nas últimas 4 semanas (rotuladas como -3 sem, -2 sem, Passada e Atual).
 */
export function calculateWeeklyTaskEarnings(
  transactions: TransactionHistoryResponseDTO[] = [],
  referenceDate: Date = new Date(),
): WeeklyEarningsResult {
  // Encontra o início da semana atual (Segunda-feira às 00:00:00)
  const now = new Date(referenceDate);
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Segunda, 6 = Domingo
  const startOfCurrentWeek = new Date(now);
  startOfCurrentWeek.setDate(now.getDate() - dayOfWeek);
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const startOfWeek3 = new Date(startOfCurrentWeek);
  startOfWeek3.setDate(startOfCurrentWeek.getDate() - 7);

  const startOfWeek2 = new Date(startOfCurrentWeek);
  startOfWeek2.setDate(startOfCurrentWeek.getDate() - 14);

  const startOfWeek1 = new Date(startOfCurrentWeek);
  startOfWeek1.setDate(startOfCurrentWeek.getDate() - 21);

  const weekGains = [0, 0, 0, 0];

  for (const tx of transactions) {
    // Considera apenas conclusões de tarefas ou transações com ganho positivo de ouro
    const isCompleted = tx.transactionType === "TASK_COMPLETED";
    const gold = tx.goldAmount ?? 0;

    if (!isCompleted || gold <= 0 || !tx.createdAt) {
      continue;
    }

    const txDate = new Date(tx.createdAt);
    if (Number.isNaN(txDate.getTime())) {
      continue;
    }

    if (txDate >= startOfCurrentWeek) {
      weekGains[3] += gold;
    } else if (txDate >= startOfWeek3) {
      weekGains[2] += gold;
    } else if (txDate >= startOfWeek2) {
      weekGains[1] += gold;
    } else if (txDate >= startOfWeek1) {
      weekGains[0] += gold;
    }
  }

  const maxGold = Math.max(...weekGains, 0);
  const weekStarts = [
    startOfWeek1,
    startOfWeek2,
    startOfWeek3,
    startOfCurrentWeek,
  ];
  const relativeLabels = ["-3 sem", "-2 sem", "Passada", "Atual"];

  const bars: EconomyBarData[] = weekGains.map((gold, index) => {
    const isHighlight = index === 3;
    const heightPercent =
      maxGold > 0
        ? gold === 0
          ? 10
          : Math.max(16, Math.round((gold / maxGold) * 100))
        : 10;

    const startDate = weekStarts[index];
    const periodLabel = startDate ? formatPeriodRange(startDate) : undefined;

    return {
      label: relativeLabels[index] ?? `Sem ${index + 1}`,
      periodLabel,
      gold,
      heightPercent,
      isHighlight,
    };
  });

  return {
    bars,
    currentWeekEarnings: weekGains[3],
  };
}
