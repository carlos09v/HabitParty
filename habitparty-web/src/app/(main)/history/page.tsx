import { serverApi } from "@/api/server";
import { HistoryContainer } from "@/components/history/HistoryContainer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { getCompactMode } from "@/utils/cookies";

interface HistoryPageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const isCompact = await getCompactMode();
  const resolvedParams = await searchParams;

  const currentTab = resolvedParams.tab || "ALL";
  const currentPageNumber = resolvedParams.page
    ? Math.max(1, parseInt(resolvedParams.page, 10))
    : 1;
  const apiPageIndex = currentPageNumber - 1;

  const { data: historyData } = await serverApi.GET("/transactions", {
    params: {
      query: {
        tab: currentTab === "ALL" ? undefined : currentTab,
        page: apiPageIndex,
        size: 8,
      },
    },
    next: { tags: ["transactions"] },
  });

  const pageData = historyData || {
    content: [],
    totalElements: 0,
    totalPages: 1,
    size: 8,
    number: 0,
  };

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16">
        {/* WELCOME CARD DO EXTRATO (SEM MÉTRICAS) */}
        <WelcomeCard
          compact={isCompact}
          title="Extrato de Transações"
          subtitle="Consulte o histórico detalhado de moedas, XP e resgates."
          bullets={[
            "Conclusões de tarefas, diárias e hábitos registram ganhos de moedas e XP.",
            "Penalidades de hábitos negativos e falhas computam deduções no saldo.",
            "Resgates na loja e consumo de itens da mochila ficam arquivados neste extrato.",
          ]}
          imageSrc="/assets/undraw/transaction/undraw_time-change_lyxp 1.svg"
          storageKey="history"
        />

        {/* CONTAINER DO EXTRATO COM BUSCA, ABAS, TABELA E PAGINAÇÃO */}
        <HistoryContainer
          pageData={pageData}
          currentTab={currentTab}
          currentPage={currentPageNumber}
          isCompact={isCompact}
        />
      </div>
    </PageWrapper>
  );
}
