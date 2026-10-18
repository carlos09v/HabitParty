import { HistoryContainer } from "@/components/history/HistoryContainer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getHistoryData } from "@/services/historyService";
import type { HistoryPeriodFilter } from "@/types/history";
import { getCompactMode } from "@/utils/cookies";

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
    ? Math.max(1, parseInt(resolvedParams.page, 10))
    : 1;

  // Busca o extrato de forma limpa e otimizada via serviço centralizado
  const pageData = await getHistoryData({
    tab: currentTab,
    period: currentPeriod,
    search: currentSearch,
    page: currentPageNumber,
    size: 8,
  });

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16">
        <HistoryContainer
          pageData={pageData}
          currentTab={currentTab}
          currentPage={currentPageNumber}
          currentPeriod={currentPeriod}
          currentSearch={currentSearch}
          isCompact={isCompact}
        />
      </div>
    </PageWrapper>
  );
}
