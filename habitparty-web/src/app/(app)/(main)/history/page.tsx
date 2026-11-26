import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistoryTable } from "@/components/history/HistoryTable";
import { HistoryWelcomeCard } from "@/components/history/HistoryWelcomeCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { RetryRefreshButton } from "@/components/ui/RetryRefreshButton";
import { ExperienceModeFallbackProvider } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getHistoryData } from "@/services/historyService";
import { getCurrentUser } from "@/services/userService";
import {
  getDateFormat,
  getTimeFormat,
  getUserTimezoneCookie,
} from "@/utils/cookies";
import { resolveExperienceMode } from "@/utils/experienceMode";
import {
  buildHistoryHref,
  groupTransactionsByDay,
  hasActiveHistoryFilters,
  isChronologicalHistorySort,
  normalizeHistoryQuery,
  type RawHistorySearchParams,
  summarizeHistoryPage,
} from "@/utils/historyUtils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface HistoryPageProps {
  searchParams: Promise<RawHistorySearchParams>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const resolvedParams = await searchParams;
  const query = normalizeHistoryQuery(resolvedParams);

  const [
    tPage,
    tUtils,
    locale,
    dateFormat,
    timeFormat,
    cookieTimeZone,
    currentUser,
    historyResult,
  ] = await Promise.all([
    getTranslations("history.page"),
    getTranslations("history.utils"),
    getLocale(),
    getDateFormat(),
    getTimeFormat(),
    getUserTimezoneCookie(),
    getCurrentUser(),
    getHistoryData({
      tab: query.tab,
      period: query.period,
      from: query.from,
      to: query.to,
      search: query.search,
      direction: query.direction,
      sort: query.sort,
      page: query.page,
      size: query.size,
    }),
  ]);

  if (!currentUser) {
    redirect("/signIn");
  }

  const pageData = historyResult.data;
  const transactions = pageData.content || [];
  const totalElements = pageData.totalElements ?? transactions.length;
  const effectiveSize = pageData.size || query.size;
  const totalPages = Math.max(
    1,
    pageData.totalPages ?? Math.ceil(totalElements / effectiveSize),
  );

  const buildPaginationHref = (page: number) =>
    buildHistoryHref("/history", { ...query, page });

  // Não redireciona silenciosamente em caso de falha na API (evita perder contexto da URL)
  if (!historyResult.error && query.page > totalPages) {
    redirect(buildPaginationHref(totalPages));
  }

  const summary = summarizeHistoryPage(
    transactions,
    totalElements,
    pageData.summary,
  );
  const userTimeZone = currentUser.timezone ?? cookieTimeZone ?? null;
  const initialGroups =
    !historyResult.error && isChronologicalHistorySort(query.sort)
      ? groupTransactionsByDay(
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
        )
      : undefined;

  const activeFilters = hasActiveHistoryFilters(query);

  return (
    <ScopedIntlProvider scope="history">
      <ExperienceModeFallbackProvider
        mode={resolveExperienceMode(currentUser.experienceMode)}
      >
        <PageWrapper className="md:py-4">
          <div className="flex flex-col gap-3 sm:gap-3.5 w-full max-w-6xl mx-auto pb-4 lg:pb-1">
            {/* Welcome Card com totais reais do período filtrado (oculto quando há erro para não exibir KPIs zerados falsos) */}
            {!historyResult.error && (
              <HistoryWelcomeCard
                summary={summary}
                currentTab={query.tab}
                currentDirection={query.direction}
              />
            )}

            {/* Barra de Filtros, Filtros Avançados e Exportação CSV em Streaming */}
            <HistoryFilters query={query} />

            {/* Estado honesto de erro na API (sem tabela vazia contraditória abaixo) */}
            {historyResult.error ? (
              <div
                role="alert"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{tPage("loadErrorTitle")}</span>
                    <span className="opacity-90">
                      {tPage("loadErrorDescription")}
                    </span>
                  </div>
                </div>
                <RetryRefreshButton
                  label={tPage("retryButton")}
                  iconSize={14}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shrink-0 transition-colors"
                />
              </div>
            ) : (
              /* Tabela de Transações Agrupada por Dia (ou plana por valor) e Paginação RSC via Link */
              <div className="flex flex-col gap-2.5">
                <HistoryTable
                  transactions={transactions}
                  initialGroups={initialGroups}
                  initialDateFormat={dateFormat}
                  initialTimeFormat={timeFormat}
                  initialTimeZone={userTimeZone}
                  sort={query.sort}
                  hasActiveFilters={activeFilters}
                  selectable
                />

                <Pagination
                  currentPage={query.page}
                  totalPages={totalPages}
                  totalItems={totalElements}
                  itemsPerPage={effectiveSize}
                  itemLabel={tPage("paginationItemLabel")}
                  buildHref={buildPaginationHref}
                  isCompact
                />
              </div>
            )}
          </div>
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    </ScopedIntlProvider>
  );
}
