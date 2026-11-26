import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  resolveAdminUserFilter,
} from "@/constants/admin";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getAdminOverview, getAdminUsers } from "@/services/adminService";
import { getCurrentUser } from "@/services/userService";
import { buildAdminUsersUrl } from "@/utils/adminUtils";
import { getDateFormat } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface AdminPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    page?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [user, resolvedParams, dateFormat, tDashboard] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getDateFormat(),
    getTranslations("admin.dashboard"),
  ]);

  // Trava de segurança: Se não for ADMIN, redireciona imediatamente
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const search = (resolvedParams.search ?? "").trim();
  const filter = resolveAdminUserFilter(resolvedParams.filter);
  const parsedPage1Based = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page0Based =
    Number.isFinite(parsedPage1Based) && parsedPage1Based > 1
      ? parsedPage1Based - 1
      : 0;

  const [overview, usersPage] = await Promise.all([
    getAdminOverview(),
    getAdminUsers({
      search,
      filter,
      page: page0Based,
      size: ADMIN_DEFAULT_PAGE_SIZE,
    }),
  ]);

  const users = usersPage?.content ?? [];
  const totalPages = usersPage?.totalPages ?? 0;
  const totalElements = usersPage?.totalElements ?? 0;

  if (totalPages > 0 && page0Based >= totalPages) {
    redirect(
      buildAdminUsersUrl({
        search,
        filter,
        page: totalPages,
      }),
    );
  }

  return (
    <ScopedIntlProvider scope="admin">
      <PageWrapper>
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-16 animate-in fade-in duration-200">
          {/* HEADER ESTÁTICO NO SERVIDOR + BOTÃO CLIENT DE REFRESH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-magenta/15 border border-magenta/35 text-magenta dark:text-fuchsia-300 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck size={14} aria-hidden="true" />
                {tDashboard("badge")}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-50 tracking-tight">
                {tDashboard("title")}
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                {tDashboard("subtitle")}
              </p>
            </div>

            <AdminRefreshButton />
          </div>

          <AdminDashboardView
            currentAdminId={user.id ?? ""}
            overviewCards={
              overview ? (
                <AdminOverviewCards
                  overview={overview}
                  dateFormat={dateFormat}
                  userTimeZone={user.timezone}
                />
              ) : null
            }
            users={users}
            totalPages={totalPages}
            totalElements={totalElements}
            currentPage={page0Based}
            search={search}
            filter={filter}
          />
        </div>
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
