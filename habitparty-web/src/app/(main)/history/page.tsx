import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistoryTable } from "@/components/history/HistoryTable";
import { HistoryWelcomeCard } from "@/components/history/HistoryWelcomeCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { getHistoryData } from "@/services/historyService";
import type { HistoryPeriodFilter } from "@/types/history";
import { summarizeHistoryPage } from "@/utils";
import { getCompactMode } from "@/utils/cookies";

export const metadata = {
  title: "Extrato & Histórico | HabitParty",
  description:
    "Consulte e exporte seu extrato de moedas, XP, tarefas, foco e recompensas.",
};

interface HistoryPageProps {
  searchParams: Promise<{
    tab?: string;
    period?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const isCompact = await getCompactMode();
  const resolvedParams = await searchParams;

  const currentTab = resolvedParams.tab || "ALL";
  const currentPeriod = (resolvedParams.period as HistoryPeriodFilter) || "ALL";
  const currentSearch = resolvedParams.search || "";
  const currentPageNumber = resolvedParams.page
    ? Math.max(1, Number.parseInt(resolvedParams.page, 10))
    : 1;

  // Consulta paginada diretamente no servidor
  const pageData = await getHistoryData({
    tab: currentTab,
    period: currentPeriod,
    search: currentSearch,
    page: currentPageNumber,
    size: 8,
  });

  const transactions = pageData.content || [];
  const totalElements = pageData.totalElements ?? transactions.length;
  const totalPages =
    pageData.totalPages ??
    Math.max(1, Math.ceil(totalElements / (pageData.size || 8)));

  // Pré-calcula o resumo no servidor para não serializar o array de transações duas vezes
  const summary = summarizeHistoryPage(transactions, totalElements);

  const buildPaginationHref = (page: number) => {
    const params = new URLSearchParams();
    if (currentTab && currentTab !== "ALL") params.set("tab", currentTab);
    if (currentPeriod && currentPeriod !== "ALL")
      params.set("period", currentPeriod);
    if (currentSearch) params.set("search", currentSearch);
    if (page > 1) params.set("page", page.toString());
    const qs = params.toString();
    return qs ? `/history?${qs}` : "/history";
  };

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16">
        {/* Welcome Card com estatísticas pré-calculadas no servidor */}
        <HistoryWelcomeCard summary={summary} isCompact={isCompact} />

        {/* Barra de Filtros e Busca conectada à URL */}
        <HistoryFilters
          currentTab={currentTab}
          currentPeriod={currentPeriod}
          currentSearch={currentSearch}
          isCompact={isCompact}
        />

        {/* Tabela de Transações Agrupada por Dia e Paginação RSC via Link */}
        <div className="flex flex-col gap-4">
          <HistoryTable transactions={transactions} isCompact={isCompact} />

          <Pagination
            currentPage={currentPageNumber}
            totalPages={totalPages}
            totalItems={totalElements}
            itemsPerPage={pageData.size || 8}
            itemLabel="transações"
            isCompact={isCompact}
            buildHref={buildPaginationHref}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
