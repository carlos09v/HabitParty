import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistoryTable } from "@/components/history/HistoryTable";
import { HistoryWelcomeCard } from "@/components/history/HistoryWelcomeCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Pagination } from "@/components/ui/Pagination";
import type { AppLocale } from "@/i18n/config";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getHistoryData } from "@/services/historyService";
import { getCurrentUser } from "@/services/userService";
import type { HistoryPeriodFilter } from "@/types/history";
import { groupTransactionsByDay, summarizeHistoryPage } from "@/utils";
import { getDateFormat, getTimeFormat } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface HistoryPageProps {
  searchParams: Promise<{
    tab?: string;
    period?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const resolvedParams = await searchParams;

  const currentTab = resolvedParams.tab || "ALL";
  const currentPeriod = (resolvedParams.period as HistoryPeriodFilter) || "ALL";
  const currentSearch = resolvedParams.search || "";
  const parsedPage = resolvedParams.page
    ? Number.parseInt(resolvedParams.page, 10)
    : 1;
  const currentPageNumber =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // Consulta paginada e preferências de formatação diretamente no servidor
  const [tPage, tUtils, locale, dateFormat, timeFormat, currentUser, pageData] =
    await Promise.all([
      getTranslations("history.page"),
      getTranslations("history.utils"),
      getLocale(),
      getDateFormat(),
      getTimeFormat(),
      getCurrentUser(),
      getHistoryData({
        tab: currentTab,
        period: currentPeriod,
        search: currentSearch,
        page: currentPageNumber,
        size: 8,
      }),
    ]);

  const transactions = pageData.content || [];
  const totalElements = pageData.totalElements ?? transactions.length;
  const totalPages = Math.max(
    1,
    pageData.totalPages ?? Math.ceil(totalElements / (pageData.size || 8)),
  );

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

  if (currentPageNumber > totalPages) {
    redirect(buildPaginationHref(totalPages));
  }

  // Pré-calcula o resumo e o agrupamento diário no servidor
  const summary = summarizeHistoryPage(transactions, totalElements);
  const userTimeZone = currentUser?.timezone ?? null;
  const initialGroups = groupTransactionsByDay(
    transactions,
    new Date(),
    locale as AppLocale,
    dateFormat,
    userTimeZone,
    {
      unknownDate: tUtils("unknownDate"),
      today: tUtils("today"),
      yesterday: tUtils("yesterday"),
    },
  );

  return (
    <ScopedIntlProvider scope="history">
      <PageWrapper className="md:py-4">
        <div className="flex flex-col gap-3 sm:gap-3.5 w-full max-w-6xl mx-auto pb-4 lg:pb-1">
          {/* Welcome Card com estatísticas pré-calculadas no servidor */}
          <HistoryWelcomeCard summary={summary} />

          {/* Barra de Filtros e Busca conectada à URL */}
          <HistoryFilters
            currentTab={currentTab}
            currentPeriod={currentPeriod}
            currentSearch={currentSearch}
          />

          {/* Tabela de Transações Agrupada por Dia e Paginação RSC via Link */}
          <div className="flex flex-col gap-2.5">
            <HistoryTable
              transactions={transactions}
              initialGroups={initialGroups}
              initialDateFormat={dateFormat}
              initialTimeFormat={timeFormat}
              initialTimeZone={userTimeZone}
              selectable
            />

            <Pagination
              currentPage={currentPageNumber}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={pageData.size || 8}
              itemLabel={tPage("paginationItemLabel")}
              buildHref={buildPaginationHref}
              isCompact
            />
          </div>
        </div>
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
